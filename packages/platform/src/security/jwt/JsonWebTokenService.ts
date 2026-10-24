import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';
import type { JwtService, JwtSignOptions } from './JwtService.js';
import { createHash } from 'crypto';

function parseTTL(ttl: string | number): number {
  if (typeof ttl === 'number') return ttl;
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) return 900;
  const [, num, unit] = match;
  const n = parseInt(num, 10);
  switch (unit) {
    case 's':
      return n;
    case 'm':
      return n * 60;
    case 'h':
      return n * 3600;
    case 'd':
      return n * 86400;
    default:
      return 900;
  }
}

export class JsonWebTokenService implements JwtService {
  private readonly secret: Uint8Array;
  private readonly algorithm: string;
  private readonly defaultIssuer?: string;
  private readonly defaultAudience?: string;
  private readonly secretFingerprint: string;
  private readonly instanceId: string;

  constructor(options?: {
    secret?: string;
    algorithm?: string;
    issuer?: string;
    audience?: string;
  }) {
    this.instanceId = `jwt-platform-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const secret = options?.secret ?? process.env['JWT_SECRET'];
    if (!secret || secret.length < 16) {
      throw new Error('JWT_SECRET must be configured with at least 16 characters');
    }
    this.secret = new TextEncoder().encode(secret);
    this.secretFingerprint = createHash('sha256').update(secret).digest('hex');
    this.algorithm = options?.algorithm ?? 'HS256';
    this.defaultIssuer = options?.issuer ?? process.env['JWT_ISSUER'];
    this.defaultAudience = options?.audience ?? process.env['JWT_AUDIENCE'];
    
    console.log('[FORENSIC] Platform JWT Service constructed', {
      instanceId: this.instanceId,
      algorithm: this.algorithm,
      secretFingerprint: this.secretFingerprint,
      secretLength: secret.length,
      issuer: this.defaultIssuer,
      audience: this.defaultAudience
    });
  }

  async sign(payload: Record<string, unknown>, options?: JwtSignOptions): Promise<string> {
    const key = this.secret;
    let builder = new SignJWT(payload as JWTPayload).setProtectedHeader({
      alg: this.algorithm,
    });

    const issuer = options?.issuer ?? this.defaultIssuer;
    const audience = options?.audience ?? this.defaultAudience;

    if (issuer) builder = builder.setIssuer(issuer);
    if (audience) {
      builder = builder.setAudience(Array.isArray(audience) ? audience : [audience]);
    }
    if (options?.subject) builder = builder.setSubject(options.subject);

    builder = builder.setIssuedAt();

    const expiresIn = options?.expiresIn ?? process.env['JWT_ACCESS_TTL'] ?? '15m';
    builder = builder.setExpirationTime(
      typeof expiresIn === 'string' && /^\d+$/.test(expiresIn)
        ? `${expiresIn}s`
        : typeof expiresIn === 'number'
          ? `${expiresIn}s`
          : (expiresIn as string)
    );

    const token = await builder.sign(key);
    const tokenFingerprint = createHash('sha256').update(token).digest('hex').slice(0, 16);
    
    console.log('[FORENSIC] JWT signed', {
      instanceId: this.instanceId,
      algorithm: this.algorithm,
      secretFingerprint: this.secretFingerprint,
      tokenLength: token.length,
      tokenFingerprint,
      issuer,
      audience,
      subject: options?.subject
    });

    return token;
  }

  async verify<T>(token: string): Promise<T> {
    const key = this.secret;
    const verifyOptions: Record<string, unknown> = {
      algorithms: [this.algorithm],
    };
    if (this.defaultIssuer) verifyOptions['issuer'] = this.defaultIssuer;
    if (this.defaultAudience) verifyOptions['audience'] = [this.defaultAudience];

    const tokenFingerprint = createHash('sha256').update(token).digest('hex').slice(0, 16);
    
    console.log('[FORENSIC] JWT verify started', {
      instanceId: this.instanceId,
      algorithm: this.algorithm,
      secretFingerprint: this.secretFingerprint,
      tokenLength: token.length,
      tokenFingerprint,
      issuer: this.defaultIssuer,
      audience: this.defaultAudience
    });

    try {
      const { payload } = await jwtVerify(token, key, verifyOptions);
      console.log('[FORENSIC] JWT verify success', {
        instanceId: this.instanceId,
        tokenFingerprint
      });
      return payload as unknown as T;
    } catch (error) {
      console.log('[FORENSIC] JWT verify failed', {
        instanceId: this.instanceId,
        tokenFingerprint,
        error: String(error)
      });
      throw error;
    }
  }
}

void parseTTL; // suppress unused warning — parseTTL is a utility kept for future use
