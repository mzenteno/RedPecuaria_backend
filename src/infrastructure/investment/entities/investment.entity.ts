import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'investments' })
export class InvestmentEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'property_id', type: 'bigint' })
  propertyId: string;

  @Column({ type: 'integer' })
  gestion: number;

  @Column({ type: 'varchar', length: 255 })
  description: string;

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

  @Column({ name: 'is_finished', type: 'boolean', default: false })
  isFinished: boolean;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
