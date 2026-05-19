'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
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
    <main className="gradient-mesh-login min-h-dvh flex flex-col items-center justify-center px-5"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>

      {/* Glass card */}
      <div className="liquid-glass squircle-card-lg w-full max-w-sm px-7 py-9">

        {/* Logo block */}
        <div className="flex flex-col items-center mb-9">
          <div
            className="w-[76px] h-[76px] squircle-btn flex items-center justify-center mb-5"
            style={{
              background: 'linear-gradient(145deg, #007AFF 0%, #5856D6 100%)',
              boxShadow: '0 10px 28px rgba(0, 122, 255, 0.38), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            <AppIcon />
          </div>
          <h1 className="text-[24px] font-bold text-[var(--label-primary)] tracking-tight leading-none">
            Эста CRM
          </h1>
          <p className="text-[14px] text-[var(--label-secondary)] mt-1.5 font-medium">
            Агентство недвижимости
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-semibold text-[var(--label-primary)]">Email</label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="admin@esta.ru"
              className="input-field"
            />
            {errors.email && (
              <p className="text-[12px] text-[var(--ios-red)] font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-semibold text-[var(--label-primary)]">Пароль</label>
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
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--label-tertiary)] hover:text-[var(--label-secondary)] transition-colors p-1"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[12px] text-[var(--ios-red)] font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="rounded-[12px] px-4 py-3 text-center"
              style={{ background: 'rgba(255,59,48,0.10)', border: '0.5px solid rgba(255,59,48,0.22)' }}
            >
              <p className="text-[13px] font-semibold text-[var(--ios-red)]">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="press-scale mt-1 h-[52px] squircle-btn w-full text-white font-bold text-[16px] flex items-center justify-center gap-2 disabled:opacity-55"
            style={{
              background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
              boxShadow: '0 5px 18px rgba(0, 122, 255, 0.34)',
            }}
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Войти'}
          </button>
        </form>
      </div>

      <p className="mt-5 text-[12px] text-[var(--label-quaternary)] text-center font-medium tracking-wide">
        ЭСТА НЕДВИЖИМОСТЬ © {new Date().getFullYear()}
      </p>
    </main>
  );
}

function AppIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[38px] h-[38px]">
      <path d="M24 5L4 20.5h4.5V43h31V20.5H44L24 5z" fill="rgba(255,255,255,0.92)" />
      <rect x="17.5" y="27" width="13" height="16" rx="3" fill="rgba(0,50,180,0.30)" />
      <rect x="6.5" y="22" width="10" height="8" rx="2" fill="rgba(255,255,255,0.38)" />
      <rect x="31.5" y="22" width="10" height="8" rx="2" fill="rgba(255,255,255,0.38)" />
    </svg>
  );
}
