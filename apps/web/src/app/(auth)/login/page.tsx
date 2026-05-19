'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2 } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { useAppStore } from '@/lib/store/useAppStore';
import { Button } from '@/components/atoms/Button';
import { FormField } from '@/components/molecules/FormField';

const schema = z.object({
  email:    z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAppStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);

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
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 bg-[var(--bg-primary)]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 squircle-btn bg-[var(--ios-blue)] flex items-center justify-center mb-4">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--label-primary)]">Эста CRM</h1>
          <p className="text-sm text-[var(--label-secondary)] mt-1">Агентство недвижимости</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            error={errors.email}
            {...register('email')}
          />
          <FormField
            label="Пароль"
            type="password"
            autoComplete="current-password"
            error={errors.password}
            {...register('password')}
          />

          {error && (
            <p className="text-sm text-[var(--ios-red)] text-center">{error}</p>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full mt-2">
            Войти
          </Button>
        </form>
      </div>
    </main>
  );
}
