export type TransactionType = 'PEMBELIAN' | 'PENJUALAN' | 'OPERASIONAL';
export type DedakType = 'MURNI' | 'CAMPURAN' | 'CEPU' | 'NON_DEDAK';
export type PaymentStatus = 'LUNAS' | 'TEMPO';

export type Transaction = {
  id: string;
  type: TransactionType;
  dedakType: DedakType;
  title: string;
  amount: number | string;
  quantityKg: number | string;
  pricePerKg: number | string;
  paymentStatus: PaymentStatus;
  contactName?: string | null;
  note?: string | null;
  createdAt: string;
};

export type InventoryItem = {
  id: string;
  dedakType: DedakType;
  stockKg: number | string;
  dibeli?: number | string;
  terjual?: number | string;
  pembelianModal?: number | string;
  penjualan?: number | string;
};

export type TransactionFormData = {
  type: TransactionType;
  dedakType: DedakType;
  title: string;
  amount: string;
  quantityKg: string;
  pricePerKg: string;
  paymentStatus: PaymentStatus;
  contactName: string;
  note: string;
};

export type ApiErrorBody = {
  message?: string | string[];
};
