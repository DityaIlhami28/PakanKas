'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { getApiErrorMessage } from '@/lib/api';

export default function InputTransactionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    type: 'PENJUALAN',
    dedakType: 'MURNI',
    title: '',
    operationalAmount: '', // hanya dipakai saat type === OPERASIONAL
    quantityKg: '',
    pricePerKg: '',
    paymentStatus: 'LUNAS',
    contactName: '',
    note: '',
  });

  // Satu-satunya sumber kebenaran untuk nilai total (dihitung ulang tiap render)
  const computedAmount = useMemo(() => {
    if (formData.type === 'OPERASIONAL') {
      return formData.operationalAmount;
    }

    const qty = Number(formData.quantityKg);
    const price = Number(formData.pricePerKg);

    if (
      formData.quantityKg === '' ||
      formData.pricePerKg === '' ||
      Number.isNaN(qty) ||
      Number.isNaN(price)
    ) {
      return '';
    }

    return String(qty * price);
  }, [formData.type, formData.operationalAmount, formData.quantityKg, formData.pricePerKg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        type: formData.type,
        dedakType: formData.dedakType,
        amount: Number(computedAmount || 0),
        quantityKg: formData.type === 'OPERASIONAL' ? 0 : Number(formData.quantityKg || 0),
        pricePerKg: formData.type === 'OPERASIONAL' ? 0 : Number(formData.pricePerKg || 0),
        paymentStatus: formData.paymentStatus,
        contactName: formData.contactName,
        note: formData.note,
      };

      await api.post('/transactions', payload);
      router.push('/dashboard');
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'Terjadi kesalahan sistem.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f3f1] text-slate-800">
      <header className="bg-[#11263c] text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7b82d] text-xl text-[#11263c]">
              ⬢
            </div>
            <div>
              <div className="text-[1.7rem] font-bold tracking-tight">Pembukuan Usaha Dedak</div>
              <div className="text-sm text-slate-300">Pencatatan Murni, Campuran, Cepu &amp; Arus Kas</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 rounded-full bg-[#f7b82d] px-5 py-3 text-base font-semibold text-[#11263c] shadow-md transition hover:bg-[#f4aa10]"
          >
            <span className="text-xl">←</span>
            Kembali ke Dashboard
          </button>
        </div>

        <nav className="mx-auto flex max-w-7xl items-center gap-8 border-t border-white/10 px-6 py-4 text-sm font-medium text-slate-200">
          <button className="flex items-center gap-2 text-slate-300">
            <span>◔</span>
            Ringkasan Dashboard
          </button>
          <button className="flex items-center gap-2 text-slate-300">
            <span>₹</span>
            Riwayat Transaksi
          </button>
          <button className="flex items-center gap-2 border-b-2 border-[#f7b82d] pb-2 text-white">
            <span>◫</span>
            Stok Dedak
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="rounded-2xl bg-[#f6f6f5] p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">Transaksi Baru</div>
              <h1 className="mt-2 text-[2.2rem] font-extrabold tracking-tight text-slate-800">Catat Transaksi</h1>
            </div>
          </div>

          {error && <div className="mb-5 rounded bg-red-100 p-3 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Jenis Gerakan Dana</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-700 outline-none transition focus:border-[#11263c]"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="PENJUALAN">PENJUALAN (Stok Keluar)</option>
                  <option value="PEMBELIAN">PEMBELIAN (Stok Masuk)</option>
                  <option value="OPERASIONAL">OPERASIONAL (Biaya Lain)</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Kategori / Tipe Barang</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-700 outline-none transition focus:border-[#11263c]"
                  value={formData.dedakType}
                  onChange={(e) => setFormData({ ...formData, dedakType: e.target.value })}
                >
                  <option value="MURNI">MURNI</option>
                  <option value="CAMPURAN">CAMPURAN</option>
                  <option value="CEPU">CEPU</option>
                  <option value="NON_DEDAK">NON_DEDAK</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Judul Nota Transaksi</label>
              <input
                type="text"
                required
                placeholder="Contoh: Jual 50kg Dedak Murni ke Pak Dani"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-700 outline-none transition focus:border-[#11263c]"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {formData.type !== 'OPERASIONAL' && (
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Berat Barang (KG)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-700 outline-none transition focus:border-[#11263c]"
                    value={formData.quantityKg}
                    onChange={(e) =>
                      setFormData((current) => ({ ...current, quantityKg: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Harga Satuan per KG (Rp)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-700 outline-none transition focus:border-[#11263c]"
                    value={formData.pricePerKg}
                    onChange={(e) =>
                      setFormData((current) => ({ ...current, pricePerKg: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Total Nilai Rupiah (Rp)</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="Total uang masuk / keluar"
                  readOnly={formData.type !== 'OPERASIONAL'}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-800 outline-none transition focus:border-[#11263c] read-only:cursor-not-allowed read-only:bg-slate-100"
                  value={formData.type === 'OPERASIONAL' ? formData.operationalAmount : computedAmount}
                  onChange={(e) =>
                    setFormData((current) => ({ ...current, operationalAmount: e.target.value }))
                  }
                />
                {formData.type !== 'OPERASIONAL' ? (
                  <p className="mt-2 text-xs text-slate-500">Otomatis dihitung dari berat barang x harga per kg.</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Metode Pembayaran</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-700 outline-none transition focus:border-[#11263c]"
                  value={formData.paymentStatus}
                  onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                >
                  <option value="LUNAS">LUNAS / Tunai</option>
                  <option value="TEMPO">TEMPO (Utang/Piutang)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Nama Kontak Pelanggan / Supplier (Opsional)</label>
              <input
                type="text"
                placeholder="Nama pembeli atau petani dedak"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-700 outline-none transition focus:border-[#11263c]"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Catatan Tambahan (Opsional)</label>
              <textarea
                rows={4}
                placeholder="Keterangan tambahan..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-700 outline-none transition focus:border-[#11263c]"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-[#11263c] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#0f1d2c] disabled:bg-slate-400"
              >
                {loading ? 'Menyimpan...' : 'Simpan & Perbarui Stok'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}