import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';
import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { RefreshToken } from '@domain/auth/entities/refresh-token';
import { RefreshTokenRepository } from '@domain/auth/repositories/refresh-token.repository';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';

@Injectable()
export class RefreshTokenRepositoryAdapter implements RefreshTokenRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findByTokenHash(
    tokenHash: string,
    ctx?: TransactionContext,
  ): Promise<RefreshToken | null> {
    const row = await this.repository(ctx).findOne({ where: { tokenHash } });
    return row ? this.toDomain(row) : null;
  }

  async findActiveByUserId(
    userId: string,
    ctx?: TransactionContext,
  ): Promise<RefreshToken[]> {
    const rows = await this.repository(ctx).find({
      where: { userId, revokedAt: IsNull() },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async save(
    refreshToken: RefreshToken,
    ctx?: TransactionContext,
  ): Promise<RefreshToken> {
    const saved = await this.repository(ctx).save(this.toEntity(refreshToken));
    return this.toDomain(saved);
  }

  private repository(ctx?: TransactionContext): Repository<RefreshTokenEntity> {
    return ctx
      ? (ctx as EntityManager).getRepository(RefreshTokenEntity)
      : this.dataSource.getRepository(RefreshTokenEntity);
  }

  private toDomain(row: RefreshTokenEntity): RefreshToken {
    return RefreshToken.fromPersistence({
      id: row.id,
      userId: row.userId,
      companyId: row.companyId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      createdAt: row.createdAt,
    });
  }

  private toEntity(refreshToken: RefreshToken): RefreshTokenEntity {
    const snapshot = refreshToken.toPersistence();
    const row = new RefreshTokenEntity();
    if (snapshot.id !== null) {
      row.id = snapshot.id;
    }
    row.userId = snapshot.userId;
    row.companyId = snapshot.companyId;
    row.tokenHash = snapshot.tokenHash;
    row.expiresAt = snapshot.expiresAt;
    row.revokedAt = snapshot.revokedAt;
    row.createdAt = snapshot.createdAt;
    return row;
  }
}
