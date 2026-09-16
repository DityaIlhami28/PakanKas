import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTransactionDto {
  @IsIn(['PEMBELIAN', 'PENJUALAN', 'OPERASIONAL'])
  @IsNotEmpty({ message: 'Tipe transaksi harus diisi' })
  type!: 'PEMBELIAN' | 'PENJUALAN' | 'OPERASIONAL';

  @IsIn(['MURNI', 'CAMPURAN', 'CEPU', 'NON_DEDAK'])
  @IsNotEmpty({ message: 'Tipe dedak harus diisi' })
  dedakType!: 'MURNI' | 'CAMPURAN' | 'CEPU' | 'NON_DEDAK';

  @IsString()
  @IsNotEmpty({ message: 'Judul transaksi harus diisi' })
  @MaxLength(200)
  title!: string;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0.01)
  @Max(999999999999)
  amount!: number;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsOptional()
  @Min(0)
  @Max(999999999)
  quantityKg?: number;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsOptional()
  @Min(0)
  @Max(999999999)
  pricePerKg?: number;

  @IsNotEmpty({ message: 'Status pembayaran harus diisi' })
  @IsIn(['LUNAS', 'TEMPO'])
  paymentStatus?: 'LUNAS' | 'TEMPO';

  @IsString()
  @IsOptional()
  @MaxLength(120)
  contactName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  note?: string;
}
