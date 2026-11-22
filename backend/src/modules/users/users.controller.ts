import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '../../schemas/user.schema';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller(['api/v1/users', 'users'])
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':email')
  @ApiOperation({
    summary: 'Tra cứu thông tin người dùng theo email',
    description: 'Tìm kiếm bản ghi người dùng trong CSDL bằng địa chỉ email.',
  })
  @ApiParam({
    name: 'email',
    type: String,
    example: 'recruiter@smarthr.io',
    description: 'Địa chỉ email cần tra cứu',
  })
  @ApiResponse({
    status: 200,
    description: 'Tìm thấy người dùng hoặc trả về null',
  })
  async getAllUsers(@Param('email') email: string): Promise<User | null> {
    return this.usersService.findByEmail(email);
  }
}
