'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);
      
      // Ambil Access Token dari body JSON response
      const { accessToken } = response.data;
      
      // Simpan Access Token di localStorage untuk dipakai request API transaksional nanti
      localStorage.setItem('accessToken', accessToken);
      
      alert('Login Berhasil!');
      router.push('/dashboard'); // Alihkan ke halaman dashboard utama
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">Masuk ke PakanKas</h2>
        {error && <div className="mb-4 rounded bg-red-100 p-2 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required className="mt-1 w-full rounded border p-2 text-gray-900" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" required className="mt-1 w-full rounded border p-2 text-gray-900" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded bg-green-600 p-2 font-semibold text-white hover:bg-green-700 disabled:bg-gray-400">
            {loading ? 'Memproses...' : 'Masuk Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
