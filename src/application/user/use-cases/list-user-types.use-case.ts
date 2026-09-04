import { Inject, Injectable } from '@nestjs/common';
import { UserType } from '@domain/user/entities/user-type';
import {
  USER_TYPE_REPOSITORY,
  type UserTypeRepository,
} from '@domain/user/repositories/user-type.repository';

@Injectable()
export class ListUserTypesUseCase {
  constructor(
    @Inject(USER_TYPE_REPOSITORY)
    private readonly userTypeRepository: UserTypeRepository,
  ) {}

  async execute(): Promise<UserType[]> {
    return this.userTypeRepository.findAll();
  }
}
