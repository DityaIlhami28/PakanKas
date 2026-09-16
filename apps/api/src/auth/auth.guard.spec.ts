import { AuthGuard } from './auth.guard';
import type { JwtService } from '@nestjs/jwt';
import type { ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from './auth.guard';

jest.mock('@nestjs/jwt', () => ({
  JwtService: class JwtService {},
}));

describe('AuthGuard', () => {
  const originalSecret = process.env.ACCESS_TOKEN_SECRET;

  beforeAll(() => {
    process.env.ACCESS_TOKEN_SECRET = 'test-secret';
  });

  afterAll(() => {
    process.env.ACCESS_TOKEN_SECRET = originalSecret;
  });

  it('reads the access token from cookies when the Authorization header is missing', async () => {
    const verifyAsync = jest
      .fn()
      .mockResolvedValue({ sub: 'user-1', name: 'Tester' });
    const jwtService = { verifyAsync } as unknown as JwtService;

    const guard = new AuthGuard(jwtService);
    const request = {
      headers: {},
      cookies: {
        access_token: 'cookie-access-token',
      },
    } as unknown as AuthenticatedRequest;

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifyAsync).toHaveBeenCalledWith('cookie-access-token', {
      secret: 'test-secret',
    });
  });
});
