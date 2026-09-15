import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateTransactionDto {
  @IsNotEmpty({ message: 'Tipe transaksi harus diisi' })  
  type!: 'PEMBELIAN' | 'PENJUALAN' | 'OPERASIONAL';

  @IsNotEmpty({ message: 'Tipe dedak harus diisi' })
  dedakType!: 'MURNI' | 'CAMPURAN' | 'CEPU' | 'NON_DEDAK';

  title!: string;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  amount!: number;
    
  @IsNumber({ allowInfinity: false, allowNaN: false })
  quantityKg?: number;
  
  @IsNumber({ allowInfinity: false, allowNaN: false })
  pricePerKg?: number;
  
  @IsNotEmpty({ message: 'Status pembayaran harus diisi' })
  paymentStatus?: 'LUNAS' | 'TEMPO';
  
  contactName?: string;
  
  note?: string;
}
