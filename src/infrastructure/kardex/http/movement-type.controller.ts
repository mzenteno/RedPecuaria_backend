import { Controller, Get } from '@nestjs/common';
import { ListMovementTypesUseCase } from '@application/kardex/use-cases/list-movement-types.use-case';
import { MovementTypeResponseDto } from './dto/movement-type.response.dto';
import { MovementTypeMapper } from './movement-type.mapper';

@Controller('kardex-movement-types')
export class MovementTypeController {
  constructor(
    private readonly listMovementTypesUseCase: ListMovementTypesUseCase,
  ) {}

  @Get()
  async list(): Promise<MovementTypeResponseDto[]> {
    const movementTypes = await this.listMovementTypesUseCase.execute();
    return movementTypes.map((movementType) =>
      MovementTypeMapper.toResponse(movementType),
    );
  }
}
