import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectDb } from '@crm/shared-core';
import type { Pool } from 'pg';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { createHash } from 'crypto';

const RP_NAME = 'Эста CRM';
const RP_ID   = process.env.PASSKEY_RP_ID ?? 'localhost';
const ORIGIN  = process.env.PASSKEY_ORIGIN ?? 'http://localhost:3000';

// In-memory challenge store (TTL 5 minutes)
const challenges = new Map<string, { challenge: string; expires: number }>();

function storeChallenge(key: string, challenge: string) {
  challenges.set(key, { challenge, expires: Date.now() + 5 * 60 * 1000 });
}

function consumeChallenge(key: string): string | null {
  const entry = challenges.get(key);
  if (!entry || entry.expires < Date.now()) {
    challenges.delete(key);
    return null;
  }
  challenges.delete(key);
  return entry.challenge;
}

@Injectable()
export class PasskeyService {
  constructor(
    @InjectDb() private db: Pool,
    private jwtService: JwtService,
  ) {}

  async getRegistrationOptions(userId: string) {
    const userRow = await this.db.query(
      'SELECT id, email, full_name FROM users WHERE id = $1',
      [userId],
    );
    if (!userRow.rows[0]) throw new NotFoundException('Пользователь не найден');
    const user = userRow.rows[0];

    const existingCreds = await this.db.query(
      'SELECT credential_id FROM webauthn_credentials WHERE user_id = $1',
      [userId],
    );

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: user.email,
      userDisplayName: user.full_name ?? user.email,
      userID: Buffer.from(userId),
      attestationType: 'none',
      excludeCredentials: existingCreds.rows.map(c => ({
        id: c.credential_id as string,
        type: 'public-key' as const,
      })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    });

    storeChallenge(`reg:${userId}`, options.challenge);
    return options;
  }

  async verifyRegistration(
    userId: string,
    response: RegistrationResponseJSON,
    deviceName?: string,
  ) {
    const challenge = consumeChallenge(`reg:${userId}`);
    if (!challenge) throw new UnauthorizedException('Истёкший или отсутствующий challenge');

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new UnauthorizedException('Верификация Passkey не прошла');
    }

    const { credential, aaguid } = verification.registrationInfo;

    await this.db.query(
      `INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter, device_name, aaguid)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (credential_id) DO UPDATE SET counter = $4, last_used_at = NOW()`,
      [
        userId,
        credential.id,
        isoBase64URL.fromBuffer(credential.publicKey),
        credential.counter,
        deviceName ?? null,
        aaguid ?? null,
      ],
    );

    return { success: true };
  }

  async getAuthenticationOptions(email?: string) {
    const allowCredentials: { id: string; type: 'public-key' }[] = [];

    if (email) {
      const userRow = await this.db.query(
        `SELECT wc.credential_id FROM webauthn_credentials wc
         JOIN users u ON u.id = wc.user_id
         WHERE u.email = $1`,
        [email],
      );
      for (const row of userRow.rows) {
        allowCredentials.push({ id: row.credential_id as string, type: 'public-key' });
      }
    }

    const challengeKey = email ? `auth:${email}` : `auth:anon:${Date.now()}`;
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: 'preferred',
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    });

    storeChallenge(challengeKey, options.challenge);
    return { ...options, _challengeKey: challengeKey };
  }

  async verifyAuthentication(
    challengeKey: string,
    response: AuthenticationResponseJSON,
    ip: string,
    userAgent: string,
  ) {
    const challenge = consumeChallenge(challengeKey);
    if (!challenge) throw new UnauthorizedException('Истёкший или отсутствующий challenge');

    const credRow = await this.db.query(
      `SELECT wc.*, u.id as uid, u.email, u.role, u.full_name, u.agency_id, u.is_active
       FROM webauthn_credentials wc
       JOIN users u ON u.id = wc.user_id
       WHERE wc.credential_id = $1`,
      [response.id],
    );
    if (!credRow.rows[0]) throw new UnauthorizedException('Passkey не найден');
    const cred = credRow.rows[0];
    if (!cred.is_active) throw new UnauthorizedException('Аккаунт деактивирован');

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: cred.credential_id as string,
        publicKey: isoBase64URL.toBuffer(cred.public_key as string),
        counter: Number(cred.counter),
      },
    });

    if (!verification.verified) throw new UnauthorizedException('Верификация Passkey не прошла');

    // Update counter + last_used_at
    await this.db.query(
      'UPDATE webauthn_credentials SET counter = $1, last_used_at = NOW() WHERE credential_id = $2',
      [verification.authenticationInfo.newCounter, cred.credential_id],
    );

    // Issue tokens
    const payload = {
      sub: cred.uid as string,
      email: cred.email as string,
      role: cred.role as string,
      agency_id: cred.agency_id as string,
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    const rawRefresh = require('crypto').randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawRefresh).digest('hex');
    await this.db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip, user_agent)
       VALUES ($1, $2, NOW() + INTERVAL '30 days', $3, $4)`,
      [cred.uid, tokenHash, ip, userAgent],
    );

    return {
      access_token: accessToken,
      refresh_token: rawRefresh,
      user: {
        id: cred.uid,
        email: cred.email,
        role: cred.role,
        full_name: cred.full_name,
      },
    };
  }

  async listCredentials(userId: string) {
    const r = await this.db.query(
      `SELECT id, credential_id, device_name, created_at, last_used_at
       FROM webauthn_credentials WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return r.rows;
  }

  async deleteCredential(credId: string, userId: string) {
    await this.db.query(
      'DELETE FROM webauthn_credentials WHERE id = $1 AND user_id = $2',
      [credId, userId],
    );
    return { success: true };
  }
}
