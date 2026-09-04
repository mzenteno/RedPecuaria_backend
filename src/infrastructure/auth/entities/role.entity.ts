import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'roles' })
@Unique('UQ_roles_company_name', ['companyId', 'name'])
export class RoleEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'company_id', type: 'bigint' })
  companyId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
