import jwt from 'jsonwebtoken';
import type { ITokenService } from './ITokenService.js';

export class JwtTokenService implements ITokenService {
  constructor(
    private readonly secret: string,
    private readonly accessTokenTTL: string = '15m',
    private readonly refreshTokenTTL: string = '7d'
  ) {}

  async generateAccessToken(payload: { userId: string; tenantId?: string }): Promise<string> {
    return jwt.sign(payload, this.secret, { expiresIn: this.accessTokenTTL as any });
  }

  async generateRefreshToken(payload: { userId: string; tenantId?: string }): Promise<string> {
    return jwt.sign(payload, this.secret, { expiresIn: this.refreshTokenTTL as any });
  }

  async verifyAccessToken(token: string): Promise<{ userId: string; tenantId?: string }> {
    return jwt.verify(token, this.secret) as { userId: string; tenantId?: string };
  }

  async verifyRefreshToken(token: string): Promise<{ userId: string; tenantId?: string }> {
    return jwt.verify(token, this.secret) as { userId: string; tenantId?: string };
  }
}
