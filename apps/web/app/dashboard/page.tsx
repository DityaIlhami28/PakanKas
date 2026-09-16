'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { getApiErrorMessage, isUnauthorizedError } from '@/lib/api';
import type { InventoryItem, Transaction } from '@/lib/types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

const calculateTransactionAmount = (quantityKg: string, pricePerKg: string) => {
  if (quantityKg === '' || pricePerKg === '') {
    return '';
  }

  return String(Number(quantityKg) * Number(pricePerKg));
};

export default function DashboardPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState('');
  const [showInputModal, setShowInputModal] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [inputLoading, setInputLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [inputError, setInputError] = useState('');
  const [formData, setFormData] = useState({
    type: 'PENJUALAN',
    dedakType: 'MURNI',
    title: '',
    amount: '',
    quantityKg: '',
    pricePerKg: '',
    paymentStatus: 'LUNAS',
    contactName: '',
    note: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [invRes, txRes] = await Promise.all([
        api.get('/transactions/inventory'),
        api.get('/transactions'),
      ]);

      setInventory(Array.isArray(invRes.data) ? invRes.data : []);
      setTransactions(Array.isArray(txRes.data) ? txRes.data : []);
    } catch (requestError: unknown) {
      if (isUnauthorizedError(requestError)) {
        router.push('/login');
        return;
      }

      setError(getApiErrorMessage(requestError, 'Gagal memuat data dashboard. Silakan cek koneksi API.'));
      setInventory([]);
      setTransactions([]);
    }
  }, [router]);

  useEffect(() => {
    const loadData = window.setTimeout(() => {
      void fetchData();
    }, 0);

    return () => window.clearTimeout(loadData);
  }, [fetchData]);

  const summaryCards = useMemo(() => {
    const income = transactions
      .filter((transaction) => transaction.type === 'PENJUALAN')
      .reduce((total, transaction) => total + Number(transaction.amount ?? 0), 0);
    const expenses = transactions
      .filter((transaction) => transaction.type === 'PEMBELIAN' || transaction.type === 'OPERASIONAL')
      .reduce((total, transaction) => total + Number(transaction.amount ?? 0), 0);
    const receivables = transactions
      .filter((transaction) => transaction.type === 'PENJUALAN' && transaction.paymentStatus === 'TEMPO')
      .reduce((total, transaction) => total + Number(transaction.amount ?? 0), 0);

    return [
      {
        label: 'Total Pemasukan',
        value: formatCurrency(income),
        detail: 'Dari Penjualan Dedak',
        tone: 'green',
        icon: '↗',
      },
      {
        label: 'Total Pengeluaran',
        value: formatCurrency(expenses),
        detail: 'Modal Stok & Operasional',
        tone: 'red',
        icon: '↘',
      },
      {
        label: 'Laba Bersih (Net)',
        value: formatCurrency(income - expenses),
        detail: 'Pemasukan dikurangi Pengeluaran',
        tone: 'amber',
        icon: '$',
      },
      {
        label: 'Piutang Belum Lunas',
        value: formatCurrency(receivables),
        detail: 'Perlu Di-follow up',
        tone: 'orange',
        icon: '◔',
      },
    ];
  }, [transactions]);

  const resetModal = () => {
    setInputError('');
    setInputLoading(false);
    setFormData({
      type: 'PENJUALAN',
      dedakType: 'MURNI',
      title: '',
      amount: '',
      quantityKg: '',
      pricePerKg: '',
      paymentStatus: 'LUNAS',
      contactName: '',
      note: '',
    });
  };

  const closeModal = () => {
    if (inputLoading || isClosingModal) {
      return;
    }

    setIsClosingModal(true);
    window.setTimeout(() => {
      setIsClosingModal(false);
      setShowInputModal(false);
      resetModal();
    }, 180);
  };

  useEffect(() => {
    if (!showInputModal) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !inputLoading) {
        if (isClosingModal) {
          return;
        }

        setIsClosingModal(true);
        window.setTimeout(() => {
          setIsClosingModal(false);
          setShowInputModal(false);
          resetModal();
        }, 180);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showInputModal, inputLoading, isClosingModal]);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError('');
    setInputLoading(true);

    try {
      const payload = {
        ...formData,
        amount: Number(
          formData.type === 'OPERASIONAL'
            ? formData.amount
            : calculateTransactionAmount(formData.quantityKg, formData.pricePerKg),
        ),
        quantityKg: formData.type === 'OPERASIONAL' ? 0 : Number(formData.quantityKg || 0),
        pricePerKg: formData.type === 'OPERASIONAL' ? 0 : Number(formData.pricePerKg || 0),
      };

      await api.post('/transactions', payload);
      setShowInputModal(false);
      resetModal();
      await fetchData();
    } catch (requestError: unknown) {
      setInputError(getApiErrorMessage(requestError, 'Terjadi kesalahan sistem.'));
    } finally {
      setInputLoading(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);

    try {
      await api.post('/auth/logout');
    } catch {
      // ignore; cookie is the source of truth
    } finally {
      router.push('/login');
      setLogoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f3f1] text-slate-800">
      <header className="bg-[#11263c] text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7b82d] text-xl text-[#11263c] shadow-sm">
              ⬢
            </div>
            <div>
              <div className="text-[1.7rem] font-bold tracking-tight">Pembukuan Usaha Dedak</div>
              <div className="text-sm text-slate-300">Pencatatan Murni, Campuran, Cepu &amp; Arus Kas</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowInputModal(true)}
              className="flex items-center gap-2 rounded-full bg-[#f7b82d] px-5 py-3 text-base font-semibold text-[#11263c] shadow-md transition hover:bg-[#f4aa10]"
            >
              <span className="text-xl">＋</span>
              Catat Transaksi
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutLoading}
              className="rounded-full border border-white/25 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {logoutLoading ? 'Keluar...' : 'Keluar'}
            </button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl items-center gap-8 border-t border-white/10 px-6 py-4 text-sm font-medium text-slate-200">
          <button className="flex items-center gap-2 border-b-2 border-[#f7b82d] pb-2 text-white">
            <span>◔</span>
            Ringkasan Dashboard
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('transaction-history')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 text-slate-300 transition hover:text-white"
          >
            <span>₹</span>
            Riwayat Transaksi
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('inventory-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 text-slate-300 transition hover:text-white"
          >
            <span>◫</span>
            Stok Dedak
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-200 bg-[#f6f6f5] p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  {card.label}
                </span>
                <div
                  className={[
                    'flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold',
                    card.tone === 'green' && 'bg-emerald-100 text-emerald-700',
                    card.tone === 'red' && 'bg-rose-100 text-rose-700',
                    card.tone === 'amber' && 'bg-amber-100 text-amber-700',
                    card.tone === 'orange' && 'bg-orange-100 text-orange-700',
                  ].join(' ')}
                >
                  {card.icon}
                </div>
              </div>

              <div
                className={[
                  'text-[2.1rem] font-extrabold leading-none tracking-tight',
                  card.tone === 'green' && 'text-emerald-600',
                  card.tone === 'red' && 'text-rose-600',
                  card.tone === 'amber' && 'text-amber-700',
                  card.tone === 'orange' && 'text-orange-600',
                ].join(' ')}
              >
                {card.value}
              </div>

              <div className="mt-3 text-sm text-slate-500">{card.detail}</div>
            </div>
          ))}
        </div>

        <div id="inventory-section" className="mt-9 scroll-mt-6 rounded-2xl bg-[#f6f6f5] p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[1.8rem] font-extrabold tracking-tight text-slate-800">
              Rincian Per Tipe Dedak
            </h2>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            {inventory.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
              Belum ada data stok dedak.
            </div>
          ) : (
            inventory.map((item) => {
              const borderClass =
                item.dedakType?.toLowerCase().includes('campur')
                  ? 'border-orange-500'
                  : item.dedakType?.toLowerCase().includes('cepu')
                    ? 'border-fuchsia-500'
                    : 'border-blue-500';

              const textClass =
                item.dedakType?.toLowerCase().includes('campur')
                  ? 'text-orange-600'
                  : item.dedakType?.toLowerCase().includes('cepu')
                    ? 'text-fuchsia-600'
                    : 'text-blue-600';

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border-2 bg-white p-5 shadow-sm ${borderClass}`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className={`text-[2rem] font-bold ${textClass}`}>{item.dedakType}</div>
                    <div className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm font-semibold text-slate-600">
                      Stok: {Number(item.stockKg ?? 0)} kg
                    </div>
                  </div>

                  <div className="space-y-3 text-[1.05rem] text-slate-600">
                    <div className="flex items-center justify-between gap-4">
                      <span>Penjualan:</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(Number(item.penjualan ?? 0))}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Pembelian Modal:</span>
                      <span className="font-bold text-slate-700">{formatCurrency(Number(item.pembelianModal ?? 0))}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 text-sm text-slate-500">
                    <span>Terjual: {Number(item.terjual ?? 0)} kg</span>
                    <span>Dibeli: {Number(item.dibeli ?? 0)} kg</span>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>

        <div id="transaction-history" className="mt-9 scroll-mt-6 rounded-2xl bg-[#f6f6f5] p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-[1.8rem] font-extrabold tracking-tight text-slate-800">Transaksi Terbaru</h2>
            <div className="flex items-center gap-3">
              <button type="button" className="text-sm font-semibold text-slate-700">
                Lihat Semua
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Jenis &amp; Kategori</th>
                  <th className="px-4 py-3">Catatan</th>
                  <th className="px-4 py-3">Volume</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Belum ada transaksi yang tercatat.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-500">
                      {new Intl.DateTimeFormat('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      }).format(new Date(tx.createdAt))}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={[
                            'rounded-full px-2 py-1 text-[10px] font-bold uppercase',
                            tx.type === 'PENJUALAN' && 'bg-emerald-100 text-emerald-700',
                            tx.type === 'PEMBELIAN' && 'bg-blue-100 text-blue-700',
                            tx.type === 'OPERASIONAL' && 'bg-amber-100 text-amber-700',
                          ].join(' ')}
                        >
                          {tx.type}
                        </span>
                        <span className="font-medium text-slate-700">{tx.dedakType}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{tx.title}</td>
                    <td className="px-4 py-4 font-medium text-slate-700">{Number(tx.quantityKg ?? 0)} KG</td>
                    <td className="px-4 py-4 font-bold text-slate-800">{formatCurrency(Number(tx.amount ?? 0))}</td>
                    <td className="px-4 py-4">
                      <span
                        className={[
                          'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase',
                          tx.paymentStatus === 'LUNAS' && 'bg-emerald-100 text-emerald-700',
                          tx.paymentStatus === 'TEMPO' && 'bg-rose-100 text-rose-700',
                        ].join(' ')}
                      >
                        {tx.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
        </div>

        {error ? <div className="mt-5 rounded bg-amber-100 px-4 py-3 text-sm text-amber-700">{error}</div> : null}
      </main>

      {showInputModal ? (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
          className={`fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px] ${isClosingModal ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'}`}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
            className={`ml-auto h-full w-full max-w-2xl overflow-y-auto bg-[#f6f6f5] p-6 shadow-2xl ring-1 ring-slate-200 sm:p-8 ${isClosingModal ? 'animate-drawer-out' : 'animate-drawer-in'}`}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">Transaksi Baru</div>
                <h2 id="transaction-modal-title" className="mt-2 text-[2rem] font-extrabold tracking-tight text-slate-800">Catat Transaksi</h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Tutup form transaksi"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-xl text-slate-700 transition hover:bg-slate-300"
              >
                ×
              </button>
            </div>

            {inputError ? (
              <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">{inputError}</div>
            ) : null}

            <form onSubmit={handleCreateTransaction} className="space-y-5">
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
                      onChange={(e) => {
                        const quantityKg = e.target.value;
                        setFormData((current) => ({
                          ...current,
                          quantityKg,
                          amount: calculateTransactionAmount(quantityKg, current.pricePerKg),
                        }));
                      }}
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
                      onChange={(e) => {
                        const pricePerKg = e.target.value;
                        setFormData((current) => ({
                          ...current,
                          pricePerKg,
                          amount: calculateTransactionAmount(current.quantityKg, pricePerKg),
                        }));
                      }}
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
                    value={
                      formData.type === 'OPERASIONAL'
                        ? formData.amount
                        : calculateTransactionAmount(formData.quantityKg, formData.pricePerKg)
                    }
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={inputLoading}
                  className="rounded-full bg-[#11263c] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#0f1d2c] disabled:bg-slate-400"
                >
                  {inputLoading ? 'Menyimpan...' : 'Simpan & Perbarui Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
