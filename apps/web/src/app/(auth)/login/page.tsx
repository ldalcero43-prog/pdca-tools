'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string; user: any }>('/auth/login', form);
      setAuth(res.user, res.accessToken, res.refreshToken);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <Image src="/logo-plannr.png" alt="Plannr" width={32} height={32} className="rounded-sm" />
            <span className="text-xl font-semibold text-[#111111] tracking-tight">Plannr</span>
          </div>
          <p className="text-sm text-[#555555]">Gestão de Melhoria Contínua</p>
        </div>

        {/* Form */}
        <div className="bg-white border border-[#E5E5E5] p-8">
          <h1 className="text-base font-semibold text-[#111111] mb-6">Entrar na plataforma</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-500 text-[#555555] mb-1.5 uppercase tracking-wide">
                E-mail
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="voce@empresa.com"
                className="w-full px-3 py-2.5 border border-[#E5E5E5] bg-white text-[#111111] text-sm placeholder-[#AAAAAA] focus:outline-none focus:border-[#111111] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#555555] mb-1.5 uppercase tracking-wide">
                Senha
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 border border-[#E5E5E5] bg-white text-[#111111] text-sm placeholder-[#AAAAAA] focus:outline-none focus:border-[#111111] transition-colors"
              />
            </div>

            {error && (
              <div className="text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#111111] text-white text-sm font-medium hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E5E5E5] text-center">
            <p className="text-xs text-[#888888]">
              Não tem conta?{' '}
              <Link href="/register" className="text-[#111111] font-medium hover:underline">
                Cadastrar organização
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
