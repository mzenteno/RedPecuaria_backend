import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'companies' })
export class CompanyEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  // `text`, no `varchar`: guarda la imagen como `data:` URI en base64 (ver
  // `UpdateCompanyLogoUseCase`), no una URL — puede rondar los 2,7 MB de
  // texto para un logo de 2 MB.
  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string | null;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
