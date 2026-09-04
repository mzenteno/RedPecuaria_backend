import { Controller, Get } from '@nestjs/common';
import { ListUserTypesUseCase } from '@application/user/use-cases/list-user-types.use-case';
import { UserTypeResponseDto } from './dto/user-type.response.dto';
import { UserTypeMapper } from './user-type.mapper';

@Controller('user-types')
export class UserTypeController {
  constructor(private readonly listUserTypesUseCase: ListUserTypesUseCase) {}

  @Get()
  async list(): Promise<UserTypeResponseDto[]> {
    const userTypes = await this.listUserTypesUseCase.execute();
    return userTypes.map((userType) => UserTypeMapper.toResponse(userType));
  }
}
