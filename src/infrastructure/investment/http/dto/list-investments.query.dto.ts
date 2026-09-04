import { IsString, MinLength } from 'class-validator';

export class ListInvestmentsQueryDto {
  @IsString()
  @MinLength(1)
  propertyId: string;
}
