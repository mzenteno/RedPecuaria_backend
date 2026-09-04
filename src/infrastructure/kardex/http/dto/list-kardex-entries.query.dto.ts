import { IsString, MinLength } from 'class-validator';

export class ListKardexEntriesQueryDto {
  @IsString()
  @MinLength(1)
  investmentId: string;
}
