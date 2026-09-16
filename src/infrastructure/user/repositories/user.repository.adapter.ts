import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { PaginatedResult } from '@domain/common/paginated-result';
import { User } from '@domain/user/entities/user';
import {
  ListUsersParams,
  UserRepository,
  UserWithType,
  FindUserOptionsParams,
} from '@domain/user/repositories/user.repository';
import { UserEntity } from '../entities/user.entity';

interface UserTypeNameRaw {
  userTypeName: string;
}

@Injectable()
export class UserRepositoryAdapter implements UserRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findById(id: string, ctx?: TransactionContext): Promise<User | null> {
    const row = await this.repository(ctx).findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByUsername(
    username: string,
    ctx?: TransactionContext,
  ): Promise<User | null> {
    const row = await this.repository(ctx).findOne({
      where: { userName: username },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAllPaginated(
    params: ListUsersParams,
    ctx?: TransactionContext,
  ): Promise<PaginatedResult<UserWithType>> {
    // Un usuario puede pertenecer a varias empresas (`user_companies`), sin
    // relación ORM declarada (mismo criterio del resto del proyecto: joins
    // explícitos, no `@ManyToOne`) — se filtra por `companyId` con un join
    // manual, no hay forma de acotarlo desde `UserEntity` solo.
    const query = this.repository(ctx)
      .createQueryBuilder('user')
      .innerJoin(
        'user_companies',
        'uc',
        'uc.user_id = user.id AND uc.company_id = :companyId AND uc.is_deleted = false',
        { companyId: params.companyId },
      )
      // Nombre del tipo de usuario resuelto acá, con JOIN, en la misma
      // consulta paginada — no con un segundo fetch aparte a `/user-types`
      // cruzado a mano del lado del cliente (bug real, ver el change de este
      // cambio). `leftJoin` (no `inner`) por las dudas de que el tipo se
      // haya dado de baja — no debería romper el listado de todos modos.
      .leftJoin('user_types', 'userType', 'userType.id = user.user_type_id')
      .addSelect('userType.name', 'userTypeName')
      // Igual criterio que "Empresas": el listado no muestra dados de baja
      // (no hay todavía una vista/filtro para verlos, ver docs/user/user.md).
      .where('user.is_deleted = false');

    if (params.search) {
      query.andWhere(
        '(user.user_name ILIKE :search OR user.email ILIKE :search OR user.full_name ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    // `getCount()` antes de `skip`/`take`: un usuario tiene un solo tipo (el
    // join es N:1), así que no hay riesgo de fila duplicada inflando el
    // total — a diferencia del saldo corrido de Kardex, acá no hace falta
    // paginar en memoria.
    const total = await query.getCount();
    const { entities, raw } = await query
      .orderBy('user.created_at', 'DESC')
      .skip((params.page - 1) * params.pageSize)
      .take(params.pageSize)
      .getRawAndEntities<UserTypeNameRaw>();

    return {
      items: entities.map((row, index) => ({
        user: this.toDomain(row),
        userTypeName: raw[index]?.userTypeName ?? '—',
      })),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  async findOptions(
    params: FindUserOptionsParams,
    ctx?: TransactionContext,
  ): Promise<User[]> {
    const query = this.repository(ctx)
      .createQueryBuilder('user')
      .innerJoin(
        'user_companies',
        'uc',
        'uc.user_id = user.id AND uc.company_id = :companyId AND uc.is_deleted = false',
        { companyId: params.companyId },
      )
      .where('user.is_deleted = false');

    if (params.userTypeId) {
      query.andWhere('user.user_type_id = :userTypeId', {
        userTypeId: params.userTypeId,
      });
    }

    const rows = await query.orderBy('user.full_name', 'ASC').getMany();
    return rows.map((row) => this.toDomain(row));
  }

  async save(user: User, ctx?: TransactionContext): Promise<User> {
    const saved = await this.repository(ctx).save(this.toEntity(user));
    return this.toDomain(saved);
  }

  private repository(ctx?: TransactionContext): Repository<UserEntity> {
    return ctx
      ? (ctx as EntityManager).getRepository(UserEntity)
      : this.dataSource.getRepository(UserEntity);
  }

  private toDomain(row: UserEntity): User {
    return User.fromPersistence({
      id: row.id,
      username: row.userName,
      email: row.email,
      passwordHash: row.passwordHash,
      fullName: row.fullName,
      isDeleted: row.isDeleted,
      userTypeId: row.userTypeId,
      lastLoginAt: row.lastLoginAt,
      createdAt: row.createdAt,
    });
  }

  private toEntity(user: User): UserEntity {
    const snapshot = user.toPersistence();
    const row = new UserEntity();
    if (snapshot.id !== null) {
      row.id = snapshot.id;
    }
    row.userName = snapshot.username;
    row.email = snapshot.email;
    row.passwordHash = snapshot.passwordHash;
    row.fullName = snapshot.fullName;
    row.isDeleted = snapshot.isDeleted;
    row.userTypeId = snapshot.userTypeId;
    row.lastLoginAt = snapshot.lastLoginAt;
    row.createdAt = snapshot.createdAt;
    return row;
  }
}
