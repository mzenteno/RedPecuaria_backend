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

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
