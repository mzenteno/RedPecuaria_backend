import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'kardex_entries' })
export class KardexEntryEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'investment_id', type: 'bigint' })
  investmentId: string;

  @Column({ name: 'entry_date', type: 'date' })
  entryDate: string;

  @Column({ type: 'varchar', length: 255 })
  detail: string;

  @Column({ name: 'avg_weight', type: 'numeric', precision: 10, scale: 2 })
  avgWeight: number;

  @Column({ name: 'entry_quantity', type: 'integer', default: 0 })
  entryQuantity: number;

  @Column({
    name: 'entry_kilos',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
  })
  entryKilos: number;

  @Column({ name: 'exit_quantity', type: 'integer', default: 0 })
  exitQuantity: number;

  @Column({
    name: 'exit_kilos',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
  })
  exitKilos: number;

  @Column({ name: 'balance_quantity', type: 'integer', default: 0 })
  balanceQuantity: number;

  @Column({
    name: 'balance_kilos',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
  })
  balanceKilos: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total: number;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
