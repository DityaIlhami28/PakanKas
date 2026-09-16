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

    if (
      dto.type !== 'OPERASIONAL' &&
      (!dto.pricePerKg || dto.pricePerKg <= 0)
    ) {
      throw new BadRequestException(
        'Harga per kilo (pricePerKg) wajib diisi untuk pembelian atau penjualan!',
      );
    }

    const quantity = dto.quantityKg ? dto.quantityKg : 0;
    const amount =
      dto.type === 'OPERASIONAL'
        ? dto.amount
        : quantity * (dto.pricePerKg ?? 0);
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: dto.type,
          dedakType: dto.dedakType,
          title: dto.title,
          amount,
          quantityKg: quantity,
          pricePerKg: dto.pricePerKg || 0,
          paymentStatus: dto.paymentStatus || 'LUNAS',
          contactName: dto.contactName,
          note: dto.note,
        },
      });

      if (dto.type !== 'OPERASIONAL') {
        if (dto.type === 'PENJUALAN') {
          const stockUpdate = await tx.inventory.updateMany({
            where: {
              dedakType: dto.dedakType,
              stockKg: { gte: quantity },
            },
            data: { stockKg: { decrement: quantity } },
          });

          if (stockUpdate.count === 0) {
            throw new BadRequestException(
              `Stok dedak ${dto.dedakType} tidak cukup untuk transaksi ini.`,
            );
          }
        } else {
          await tx.inventory.upsert({
            where: { dedakType: dto.dedakType },
            update: { stockKg: { increment: quantity } },
            create: { dedakType: dto.dedakType, stockKg: quantity },
          });
        }
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
    const [inventory, transactions] = await Promise.all([
      this.prisma.inventory.findMany(),
      this.prisma.transaction.findMany({
        select: {
          type: true,
          dedakType: true,
          amount: true,
          quantityKg: true,
        },
      }),
    ]);

    return inventory.map((item) => {
      const typeTransactions = transactions.filter(
        (transaction) => transaction.dedakType === item.dedakType,
      );
      const purchasedTransactions = typeTransactions.filter(
        (transaction) => transaction.type === 'PEMBELIAN',
      );
      const soldTransactions = typeTransactions.filter(
        (transaction) => transaction.type === 'PENJUALAN',
      );

      return {
        ...item,
        dibeli: purchasedTransactions.reduce(
          (total, transaction) => total + Number(transaction.quantityKg),
          0,
        ),
        terjual: soldTransactions.reduce(
          (total, transaction) => total + Number(transaction.quantityKg),
          0,
        ),
        pembelianModal: purchasedTransactions.reduce(
          (total, transaction) => total + Number(transaction.amount),
          0,
        ),
        penjualan: soldTransactions.reduce(
          (total, transaction) => total + Number(transaction.amount),
          0,
        ),
      };
    });
  }
}
