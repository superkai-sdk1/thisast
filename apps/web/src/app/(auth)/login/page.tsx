'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Building2, Fingerprint } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { useAppStore } from '@/lib/store/useAppStore';
import { apiClient } from '@/lib/api/client';
import { startAuthentication } from '@simplewebauthn/browser';

const schema = z.object({
  email:    z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAppStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  // Start in passkey mode; switch to password form after failure/cancel
  const [mode, setMode] = useState<'passkey' | 'password'>('passkey');
  const [hasPasskeySupport, setHasPasskeySupport] = useState(false);
  const triedPasskey = useRef(false);

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function loginWithPasskey(auto = false) {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      setMode('password');
      return;
    }
    setPasskeyLoading(true);
    setError(null);
    try {
      const email = getValues('email') || undefined;
      const optRes = await apiClient.post<{ data: { _challengeKey: string } & unknown }>(
        '/auth/passkey/login-options',
        { email },
      );
      const { _challengeKey, ...options } = optRes.data.data as { _challengeKey: string } & Record<string, unknown>;
      const response = await startAuthentication({ optionsJSON: options as never });
      const loginRes = await apiClient.post<{
        data: { access_token: string; refresh_token: string; user: { id: string; email: string; role: string; full_name: string } };
      }>('/auth/passkey/login', { challengeKey: _challengeKey, response });
      const { user, access_token, refresh_token } = loginRes.data.data;
      setAuth(user as never, access_token, refresh_token ?? '');
      router.replace('/dashboard');
    } catch (e: unknown) {
      const msg = (e as Error).message ?? '';
      const isCancelled = msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('abort') || msg.toLowerCase().includes('not allowed');
      if (auto || isCancelled) {
        // Silent fallback to password form on auto-trigger or user cancel
        setMode('password');
      } else {
        setError('Passkey не найден или верификация не прошла');
        setMode('password');
      }
    } finally {
      setPasskeyLoading(false);
    }
  }

  // Auto-trigger passkey on first mount
  useEffect(() => {
    const supported = typeof window !== 'undefined' && !!window.PublicKeyCredential;
    setHasPasskeySupport(supported);
    if (triedPasskey.current) return;
    triedPasskey.current = true;
    if (supported) {
      loginWithPasskey(true);
    } else {
      setMode('password');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      const result = await authApi.login(data.email, data.password);
      setAuth(result.user, result.access_token, result.refresh_token ?? '');
      router.replace('/dashboard');
    } catch {
      setError('Неверный email или пароль');
    }
  }

  return (
    <main
      className="gradient-mesh-login min-h-dvh flex flex-col items-center justify-center px-5"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="w-full max-w-sm flex flex-col gap-6">

        {/* Logo block */}
        <div className="flex flex-col items-center gap-4 mb-2">
          <div
            className="w-20 h-20 rounded-[24px] flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, #007AFF 0%, #5856D6 100%)',
              boxShadow: '0 12px 32px rgba(0,122,255,0.38), 0 4px 12px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.28)',
            }}
          >
            <Building2 size={36} className="text-white" strokeWidth={1.8} />
          </div>
          <div className="text-center">
            <h1 className="text-[28px] font-bold tracking-tight" style={{ color: 'var(--label-primary)' }}>
              Эста CRM
            </h1>
            <p className="text-[15px] mt-1" style={{ color: 'var(--label-secondary)' }}>
              Агентство недвижимости
            </p>
          </div>
        </div>

        {/* Passkey loading state */}
        {mode === 'passkey' && (
          <div className="liquid-glass squircle-card-lg px-6 py-10 flex flex-col items-center gap-5">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(52,199,89,0.12)' }}
            >
              {passkeyLoading
                ? <Loader2 size={32} className="animate-spin" style={{ color: 'var(--ios-green)' }} />
                : <Fingerprint size={32} style={{ color: 'var(--ios-green)' }} />
              }
            </div>
            <div className="text-center">
              <p className="text-[17px] font-semibold" style={{ color: 'var(--label-primary)' }}>
                {passkeyLoading ? 'Ожидание passkey…' : 'Вход с Passkey'}
              </p>
              <p className="text-[13px] mt-1" style={{ color: 'var(--label-secondary)' }}>
                Используйте биометрию или ключ безопасности
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMode('password')}
              className="text-[13px] font-medium"
              style={{ color: 'var(--label-tertiary)' }}
            >
              Войти с паролем
            </button>
          </div>
        )}

        {/* Password form */}
        {mode === 'password' && (
          <div className="liquid-glass squircle-card-lg px-6 py-7 flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold" style={{ color: 'var(--label-secondary)' }}>
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="admin@esta.ru"
                className="input-field"
              />
              {errors.email && (
                <p className="text-[12px] font-medium" style={{ color: 'var(--ios-red)' }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold" style={{ color: 'var(--label-secondary)' }}>
                Пароль
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input-field pr-12"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 transition-opacity"
                  style={{ color: 'var(--label-tertiary)' }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[12px] font-medium" style={{ color: 'var(--ios-red)' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div
                className="rounded-[12px] px-4 py-3 text-center"
                style={{ background: 'rgba(255,59,48,0.10)', border: '1px solid rgba(255,59,48,0.20)' }}
              >
                <p className="text-[13px] font-semibold" style={{ color: 'var(--ios-red)' }}>{error}</p>
              </div>
            )}

            {/* Passkey retry */}
            {hasPasskeySupport && (
              <button
                type="button"
                onClick={() => loginWithPasskey(false)}
                disabled={passkeyLoading}
                className="press-scale h-[52px] squircle-btn w-full font-bold text-[16px] flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)',
                  boxShadow: '0 6px 20px rgba(52,199,89,0.36)',
                  color: 'white',
                }}
              >
                {passkeyLoading
                  ? <Loader2 size={20} className="animate-spin" />
                  : <><Fingerprint size={20} /> Войти с Passkey</>
                }
              </button>
            )}

            {/* Divider */}
            {hasPasskeySupport && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'var(--separator)' }} />
                <span className="text-[12px] font-medium" style={{ color: 'var(--label-quaternary)' }}>или</span>
                <div className="flex-1 h-px" style={{ background: 'var(--separator)' }} />
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="press-scale h-[52px] squircle-btn w-full text-white font-bold text-[16px] flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                boxShadow: '0 6px 20px rgba(0,122,255,0.36)',
              }}
            >
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Войти с паролем'}
            </button>
          </div>
        )}

        <p className="text-center text-[12px] font-medium tracking-wide" style={{ color: 'var(--label-quaternary)' }}>
          ЭСТА НЕДВИЖИМОСТЬ © {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
