import { Injectable, Inject } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as QRCode from 'qrcode';
import type { Pool } from 'pg';
import { DB_POOL } from '../../common/decorators/inject-connection.decorator';

@Injectable()
export class PdfService {
  private template: HandlebarsTemplateDelegate;

  constructor(@Inject(DB_POOL) private db: Pool) {
    const templatePath = join(__dirname, 'templates', 'property-card.hbs');
    const source = readFileSync(templatePath, 'utf-8');
    this.template = Handlebars.compile(source);

    Handlebars.registerHelper('formatPrice', (price: number) =>
      new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(price),
    );
    Handlebars.registerHelper('formatNum', (n: number) => n?.toLocaleString('ru') ?? '—');
  }

  async getAgentInfo(agentId: string) {
    const result = await this.db.query(
      'SELECT full_name, phone, photo_url FROM users WHERE id = $1',
      [agentId],
    );
    return result.rows[0] ?? { full_name: '', phone: '', photo_url: null };
  }

  async generatePropertyCard(
    property: Record<string, unknown>,
    agent: { full_name: string; phone: string; photo_url?: string },
  ): Promise<Buffer> {
    const qrData = `tel:${agent.phone}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 120, margin: 1 });

    const photos = (property['photos'] as Array<{ url: string }> | null) ?? [];
    const coverPhoto = photos[0]?.url ?? null;

    const html = this.template({
      property: {
        ...property,
        price_formatted: new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(property['price'])) + ' ₽',
        cover_photo: coverPhoto,
        gallery_photos: photos.slice(1, 7),
        rooms_label: property['rooms'] ? `${property['rooms']}-комн.` : '',
        area_label: property['area_sqm'] ? `${property['area_sqm']} м²` : '',
        floor_label: property['floor'] && property['floor_total'] ? `${property['floor']} из ${property['floor_total']} эт.` : '',
      },
      agent: {
        ...agent,
        qr_code: qrCodeDataUrl,
      },
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    return Buffer.from(pdf);
  }
}
