import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Authentication')
@Controller(['api/v1/auth', 'auth'])
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Đăng ký tài khoản người dùng mới',
    description: 'Tạo tài khoản Recruiter hoặc Manager, mã hóa mật khẩu Bcrypt và lưu vào CSDL.',
  })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký tài khoản thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu đầu vào không hợp lệ hoặc email đã tồn tại',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Đăng nhập hệ thống & lấy JWT Access Token',
    description: 'Xác thực thông tin tài khoản và trả về JWT Bearer Token có thời hạn.',
  })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công, trả về access_token và user info',
  })
  @ApiResponse({
    status: 401,
    description: 'Sai thông tin email hoặc mật khẩu',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy thông tin tài khoản đang đăng nhập',
    description: 'Yêu cầu Bearer Token trong Header. Trả về thông tin danh tính từ JWT Payload.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin người dùng thành công',
  })
  @ApiResponse({
    status: 401,
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  getProfile(@CurrentUser() user: any) {
    return user;
  }
}
