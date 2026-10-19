import { IsBoolean, IsString, MinLength } from 'class-validator';

export class SetKardexInvestorFinishedRequestDto {
  @IsString()
  @MinLength(1)
  investmentId: string;

  @IsString()
  @MinLength(1)
  investorUserId: string;

  @IsBoolean()
  isFinished: boolean;
}
