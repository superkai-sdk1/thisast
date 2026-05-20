'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Building2 } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { useAppStore } from '@/lib/store/useAppStore';

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

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

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

        {/* Form card */}
        <div
          className="liquid-glass squircle-card-lg px-6 py-7 flex flex-col gap-5"
        >
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

          {/* Submit */}
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="press-scale h-[52px] squircle-btn w-full text-white font-bold text-[16px] flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
            style={{
              background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
              boxShadow: '0 6px 20px rgba(0,122,255,0.36)',
            }}
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Войти'}
          </button>
        </div>

        <p className="text-center text-[12px] font-medium tracking-wide" style={{ color: 'var(--label-quaternary)' }}>
          ЭСТА НЕДВИЖИМОСТЬ © {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
