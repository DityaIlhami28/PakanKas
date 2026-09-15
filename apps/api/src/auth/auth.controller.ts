import { Body, Controller, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
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
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token ?? req.body?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token tidak ditemukan! Silakan login kembali.');
    }

    const payload = await this.authService.refreshTokens(refreshToken);
    this.setAuthCookies(res, payload.accessToken, payload.refreshToken);

    return {
      message: 'Token berhasil diperbarui!',
      user: payload.user,
    };
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req['user'] as { sub: string };
    await this.authService.logout(user.sub);
    this.clearAuthCookies(res);

    return { message: 'Logout berhasil!' };
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const secure = process.env.NODE_ENV === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
  }
}