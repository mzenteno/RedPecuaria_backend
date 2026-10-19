import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'investment_investors' })
@Unique('UQ_investment_investors_investment_user', ['investmentId', 'userId'])
export class InvestmentInvestorEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'investment_id', type: 'bigint' })
  investmentId: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: string;

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

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
