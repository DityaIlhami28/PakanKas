import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('AuthGuard', () => {
  const originalSecret = process.env.ACCESS_TOKEN_SECRET;

  beforeAll(() => {
    process.env.ACCESS_TOKEN_SECRET = 'test-secret';
  });

  afterAll(() => {
    process.env.ACCESS_TOKEN_SECRET = originalSecret;
  });

  it('reads the access token from cookies when the Authorization header is missing', async () => {
    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-1', name: 'Tester' }),
    } as unknown as JwtService;

    const guard = new AuthGuard(jwtService);
    const request = {
      headers: {},
      cookies: {
        access_token: 'cookie-access-token',
      },
    } as any;

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('cookie-access-token', {
      secret: 'test-secret',
    });
  });
});
