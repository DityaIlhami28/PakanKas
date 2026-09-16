import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED) // Explicit real-world status code (201 Created)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const payload = await this.authService.register(dto);
    this.setAuthCookies(res, payload.accessToken, payload.refreshToken);

    return {
      message: payload.message,
      user: payload.user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK) // Login requests should return a 200 OK status code instead of 201
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const payload = await this.authService.login(dto);
    this.setAuthCookies(res, payload.accessToken, payload.refreshToken);

    return {
      message: payload.message,
      user: payload.user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK) // Tokens renewals are resource access mutations returning 200 OK
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const refreshToken = cookies?.refresh_token;

    if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
      throw new UnauthorizedException(
        'Sesi masuk telah berakhir. Silakan login kembali.',
      );
    }

    try {
      const result = await this.authService.refreshTokens(refreshToken);
      this.setAuthCookies(res, result.accessToken, result.refreshToken);

      return {
        message: 'Akses token berhasil diperbarui.',
        user: result.user,
      };
    } catch {
      this.clearAuthCookies(res);
      throw new UnauthorizedException(
        'Token verifikasi tidak sah atau sudah kadaluwarsa.',
      );
    }
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req.user.sub);
    this.clearAuthCookies(res);

    return { message: 'Logout berhasil, sesi aman dihapus!' };
  }

  // Uniform security parameters configuration factory
  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction, // Uses secure HTTPS connections during production mode instances
      sameSite: 'lax', // Lax is optimal for secure front-to-back app setups
      maxAge: 15 * 60 * 1000, // Expires after 15 Minutes
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // Expires after 7 Days
      path: '/',
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
  }
}
