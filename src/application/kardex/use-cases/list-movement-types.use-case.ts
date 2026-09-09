import { Inject, Injectable } from '@nestjs/common';
import { MovementType } from '@domain/kardex/entities/movement-type';
import {
  MOVEMENT_TYPE_REPOSITORY,
  type MovementTypeRepository,
} from '@domain/kardex/repositories/movement-type.repository';

@Injectable()
export class ListMovementTypesUseCase {
  constructor(
    @Inject(MOVEMENT_TYPE_REPOSITORY)
    private readonly movementTypeRepository: MovementTypeRepository,
  ) {}

  async execute(): Promise<MovementType[]> {
    return this.movementTypeRepository.findAll();
  }
}
