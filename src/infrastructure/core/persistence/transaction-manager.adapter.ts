import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  TransactionContext,
  TransactionManager,
} from '@domain/core/ports/transaction-manager.port';

@Injectable()
export class TransactionManagerAdapter implements TransactionManager {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async run<T>(work: (ctx: TransactionContext) => Promise<T>): Promise<T> {
    return this.dataSource.transaction((manager) => work(manager));
  }
}
