import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RegisterUserUseCase } from '@application/user/use-cases/register-user.use-case';
import { UpdateUserUseCase } from '@application/user/use-cases/update-user.use-case';
import { DeactivateUserUseCase } from '@application/user/use-cases/deactivate-user.use-case';
import { ChangeUserTypeUseCase } from '@application/user/use-cases/change-user-type.use-case';
import { ListUsersUseCase } from '@application/user/use-cases/list-users.use-case';
import { PaginatedResponseDto } from '@infrastructure/common/http/paginated-response.dto';
import { CurrentUser } from '@infrastructure/common/http/current-user.decorator';
import { RegisterUserRequestDto } from './dto/register-user.request.dto';
import { UpdateUserRequestDto } from './dto/update-user.request.dto';
import { ChangeUserTypeRequestDto } from './dto/change-user-type.request.dto';
import { ListUsersQueryDto } from './dto/list-users.query.dto';
import { UserResponseDto } from './dto/user.response.dto';
import { UserMapper } from './user.mapper';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

@Controller('users')
export class UserController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deactivateUserUseCase: DeactivateUserUseCase,
    private readonly changeUserTypeUseCase: ChangeUserTypeUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
  ) {}

  @Post()
  async register(
    @Body() dto: RegisterUserRequestDto,
    @CurrentUser('companyId') companyId: string,
  ): Promise<UserResponseDto> {
    const user = await this.registerUserUseCase.execute({ ...dto, companyId });
    return UserMapper.toResponse(user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserRequestDto,
  ): Promise<UserResponseDto> {
    const user = await this.updateUserUseCase.execute({ userId: id, ...dto });
    return UserMapper.toResponse(user);
  }

  @Get()
  async list(
    @Query() query: ListUsersQueryDto,
    @CurrentUser('companyId') companyId: string,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const page = query.page ?? DEFAULT_PAGE;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const result = await this.listUsersUseCase.execute({
      page,
      pageSize,
      search: query.search,
      companyId,
    });
    return {
      data: result.items.map((user) => UserMapper.toResponse(user)),
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      },
    };
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id') id: string): Promise<void> {
    await this.deactivateUserUseCase.execute({ userId: id });
  }

  @Patch(':id/user-type')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeUserType(
    @Param('id') id: string,
    @Body() dto: ChangeUserTypeRequestDto,
    @CurrentUser('companyId') companyId: string,
  ): Promise<void> {
    await this.changeUserTypeUseCase.execute({
      userId: id,
      companyId,
      userTypeId: dto.userTypeId,
    });
  }
}
