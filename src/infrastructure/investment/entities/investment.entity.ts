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

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
