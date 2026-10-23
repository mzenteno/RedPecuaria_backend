import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'properties' })
@Unique('UQ_properties_company_name', ['companyId', 'name'])
export class PropertyEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'company_id', type: 'bigint' })
  companyId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'numeric', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'numeric', precision: 10, scale: 7 })
  longitude: number;

  /** Ver `Property.boundary` — `jsonb` con `{ lat, lng }[]`, sin PostGIS
   * (no hay consultas espaciales, solo se guarda y se dibuja). */
  @Column({ type: 'jsonb', nullable: true })
  boundary: { lat: number; lng: number }[] | null;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
