import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'user_companies' })
@Unique('UQ_user_companies_user_company', ['userId', 'companyId'])
export class UserCompanyEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: string;

  @Column({ name: 'company_id', type: 'bigint' })
  companyId: string;

  @Column({ name: 'role_id', type: 'bigint' })
  roleId: string;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
