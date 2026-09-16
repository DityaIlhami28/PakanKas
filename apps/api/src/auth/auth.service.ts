import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwt: JwtService) {}

    async getTokens(userId: string) {
        const payload = {
            sub: userId,
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwt.signAsync(payload, {
                secret: process.env.ACCESS_TOKEN_SECRET,
                expiresIn: '15m',
            }),
            this.jwt.signAsync(payload, {
                secret: process.env.REFRESH_TOKEN_SECRET,
                expiresIn: '7d',
            }),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }

    async updateRefreshToken(userId: string, refreshToken: string | null) {
        if (refreshToken) {
            const salt = await bcrypt.genSalt(10);
            const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
            await this.prisma.user.update({
                where: {
                    id: userId,
                },
                data: {
                    refresh_token: hashedRefreshToken,
                },
            });
        } else {
            await this.prisma.user.update({
                where: {
                    id: userId,
                },
                data: {
                    refresh_token: null,
                },
            });
        }
    }

    async register(dto: RegisterDto) {
        const userExists = await this.prisma.user.findUnique({ 
            where: { 
                email: dto.email 
            } 
        });

        if (userExists) throw new BadRequestException('Email sudah terdaftar!');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(dto.password, salt);

        const user = await this.prisma.user.create({
            data: { 
                name: dto.name,
                email: dto.email,
                password: hashedPassword,
            },
        });

        const tokens = await this.getTokens(user.id);
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        return {
            message: 'Register berhasil!',
            ...tokens,
            user: { id: user.id, name: user.name, email: user.email },
        };
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({ 
            where: { 
                email: dto.email 
            } 
        });

        if (!user) throw new UnauthorizedException('Email atau password salah!');

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) throw new UnauthorizedException('Email atau password salah!');

        const tokens = await this.getTokens(user.id);
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        return {
            message: 'Login berhasil!',
            ...tokens,
            user: { id: user.id, name: user.name, email: user.email },
        };
    }

    async logout(userId: string) {
        await this.updateRefreshToken(userId, null);
        return { message: 'Logout berhasil!' };
    }

    async refreshTokens(refreshToken: string) {
        const payload = await this.jwt.verifyAsync(refreshToken, {
            secret: process.env.REFRESH_TOKEN_SECRET,
        });

        const user = await this.prisma.user.findUnique({ 
            where: { 
                id: payload.sub,
            } 
        });

        if (!user || !user.refresh_token) throw new ForbiddenException('Akses ditolak!');

        const isTokenMatch = await bcrypt.compare(refreshToken, user.refresh_token);
        if (!isTokenMatch) throw new ForbiddenException('Akses ditolak!');

        const tokens = await this.getTokens(user.id);
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        return {
            ...tokens,
            user: { id: user.id, name: user.name, email: user.email },
        };
    }
}
