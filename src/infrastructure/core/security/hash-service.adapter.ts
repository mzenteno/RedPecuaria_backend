import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { HashService } from '@domain/core/ports/hash.port';

@Injectable()
export class HashServiceAdapter implements HashService {
  sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
