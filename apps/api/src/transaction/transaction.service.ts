import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTransactionDto } from './dto/transaction.dto';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTransactionDto) {
    if (
      dto.type !== 'OPERASIONAL' &&
      (!dto.quantityKg || dto.quantityKg <= 0)
    ) {
      throw new BadRequestException(
        'Jumlah kilo (quantityKg) wajib diisi untuk pembelian atau penjualan!',
      );
    }
    
    const quantity = dto.quantityKg ? dto.quantityKg : 0;
    return this.prisma.$transaction(async (tx) => {
      
      // JIKA PENJUALAN: Cek dulu apakah stok di gudang cukup
      if (dto.type === 'PENJUALAN') {
        const currentInventory = await tx.inventory.findUnique({
          where: { dedakType: dto.dedakType },
        });

        const currentStock = currentInventory ? Number(currentInventory.stockKg) : 0;

        if (currentStock < quantity) {
          throw new BadRequestException(`Stok dedak ${dto.dedakType} tidak cukup! Stok saat ini: ${currentStock} KG.`);
        }
      }

      // A. Simpan data transaksi ke database
      const transaction = await tx.transaction.create({
        data: {
          type: dto.type,
          dedakType: dto.dedakType,
          title: dto.title,
          amount: dto.amount,
          quantityKg: quantity,
          pricePerKg: dto.pricePerKg || 0,
          paymentStatus: dto.paymentStatus || 'LUNAS',
          contactName: dto.contactName,
          note: dto.note,
        },
      });

      // B. Jalankan otomatisasi update stok di tabel Inventory (Kecuali biaya OPERASIONAL)
      if (dto.type !== 'OPERASIONAL') {
        // Hitung berapa perubahan stoknya (+ jika beli, - jika jual)
        const stockChange = dto.type === 'PEMBELIAN' ? quantity : -quantity;

        // Gunakan upsert: Jika tipe dedak belum pernah ada di gudang, buat baru. Jika sudah ada, tambahkan/kurangi nilainya.
        await tx.inventory.upsert({
          where: { dedakType: dto.dedakType },
          update: {
            stockKg: { increment: stockChange },
          },
          create: {
            dedakType: dto.dedakType,
            stockKg: quantity, // Kalau pembelian pertama, langsung isi seberat kuantitas beli
          },
        });
      }

      return {
        message: `Transaksi ${dto.type} berhasil dicatat dan stok gudang telah diperbarui!`,
        data: transaction,
      };
    });
  }
  async findAll() {
    return this.prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' }, // Transaksi terbaru muncul paling atas
    });
  }

  async getInventory() {
    return this.prisma.inventory.findMany();
  }
}
