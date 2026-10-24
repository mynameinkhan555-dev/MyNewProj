export interface ITokenService {
  generateAccessToken(payload: { userId: string; tenantId?: string }): Promise<string>;
  generateRefreshToken(payload: { userId: string; tenantId?: string }): Promise<string>;
  verifyAccessToken(token: string): Promise<{ userId: string; tenantId?: string }>;
  verifyRefreshToken(token: string): Promise<{ userId: string; tenantId?: string }>;
}
