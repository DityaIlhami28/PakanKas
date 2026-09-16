'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api, { getApiErrorMessage } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'KARYAWAN' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/register', formData);
      router.push('/login');
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'Terjadi kesalahan saat registrasi.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f3f1] p-4 text-slate-800">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f7b82d] text-2xl text-[#11263c]">
            ⬢
          </div>
          <h2 className="text-2xl font-extrabold text-[#11263c]">Daftar Akun PakanKas</h2>
        </div>

        {error && <div role="alert" className="mb-4 rounded bg-red-100 p-2.5 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Nama Lengkap</label>
            <input
              type="text"
              required
              name="name"
              autoComplete="name"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-gray-900 outline-none transition focus:border-[#11263c]"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
            <input
              type="email"
              required
              name="email"
              autoComplete="email"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-gray-900 outline-none transition focus:border-[#11263c]"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
            <input
              type="password"
              required
              name="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-gray-900 outline-none transition focus:border-[#11263c]"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#11263c] px-4 py-3 font-semibold text-white transition hover:bg-[#0f1d2c] disabled:bg-slate-400"
          >
            {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-[#11263c] hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}

