import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { getRequiredEnvironmentVariable } from '../config/env';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      global: true,
      secret: getRequiredEnvironmentVariable('ACCESS_TOKEN_SECRET'),
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [AuthService, AuthGuard],
  exports: [AuthGuard],
  controllers: [AuthController],
})
export class AuthModule {}
