import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import {
  AccessTokenPayload,
  TokenGenerator,
} from '@domain/core/ports/token-generator.port';

const OPAQUE_TOKEN_BYTES = 32;

@Injectable()
export class JwtTokenGeneratorAdapter implements TokenGenerator {
  constructor(private readonly jwtService: JwtService) {}

  generateAccessToken(payload: AccessTokenPayload): string {
    return this.jwtService.sign({ ...payload });
  }

  verifyAccessToken(token: string): AccessTokenPayload | null {
    try {
      return this.jwtService.verify<AccessTokenPayload>(token);
    } catch {
      return null;
    }
  }

  generateOpaqueToken(): string {
    return randomBytes(OPAQUE_TOKEN_BYTES).toString('hex');
  }
}
