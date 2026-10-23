export class PropertyResponseDto {
  id: string;
  companyId: string;
  name: string;
  latitude: number;
  longitude: number;
  boundary: { lat: number; lng: number }[] | null;
  createdAt: Date;
}
