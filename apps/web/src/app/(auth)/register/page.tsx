'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ organizationName: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string; user: any }>('/auth/register', form);
      setAuth(res.user, res.accessToken, res.refreshToken);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { key: 'organizationName', label: 'Nome da Organização', type: 'text', placeholder: 'Acme Corp' },
    { key: 'name', label: 'Seu Nome', type: 'text', placeholder: 'João Silva' },
    { key: 'email', label: 'E-mail', type: 'email', placeholder: 'joao@acme.com' },
    { key: 'password', label: 'Senha (mínimo 8 caracteres)', type: 'password', placeholder: '••••••••' },
  ] as const;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-[#111111] rounded-sm flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="text-lg font-semibold text-[#111111] tracking-tight">PDCA Tools</span>
          </div>
          <p className="text-sm text-[#555555]">Criar conta — acesso 14 dias grátis</p>
        </div>

        <div className="bg-white border border-[#E5E5E5] p-8">
          <h1 className="text-base font-semibold text-[#111111] mb-6">Cadastrar organização</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-[#555555] mb-1.5 uppercase tracking-wide">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  required
                  value={form[field.key]}
                  onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2.5 border border-[#E5E5E5] bg-white text-[#111111] text-sm placeholder-[#AAAAAA] focus:outline-none focus:border-[#111111] transition-colors"
                />
              </div>
            ))}

            {error && (
              <div className="text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#111111] text-white text-sm font-medium hover:bg-[#333333] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E5E5E5] text-center">
            <p className="text-xs text-[#888888]">
              Já tem conta?{' '}
              <Link href="/login" className="text-[#111111] font-medium hover:underline">
                Fazer login
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[#AAAAAA] mt-4">
          Ao criar uma conta você concorda com nossos termos de uso e política de privacidade.
        </p>
      </div>
    </div>
  );
}
