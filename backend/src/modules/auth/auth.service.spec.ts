import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { User } from '../schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersService } from '../users/users.service';

describe('AuthService & JwtStrategy Test Suite', () => {
  let authService: AuthService;
  let jwtStrategy: JwtStrategy;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    passwordHash: '$2b$10$hashedpassword',
    fullName: 'Test User',
    role: 'RECRUITER',
    department: 'HR',
    status: 'ACTIVE',
  };

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mocked_jwt_token'),
    verifyAsync: jest.fn(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtStrategy,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('1. Đăng ký (register)', () => {
    it('Nên đăng ký tài khoản mới thành công và trả về accessToken', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      mockUserModel.create.mockResolvedValue(mockUser);

      const dto = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      };

      const result = await authService.register(dto);

      expect(result.message).toBe('Register successfully');
      expect(result.accessToken).toBe('mocked_jwt_token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('Nên ném lỗi ConflictException (409) khi email đã tồn tại', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });

      const dto = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      };

      await expect(authService.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('2. Đăng nhập (login)', () => {
    it('Nên đăng nhập thành công với email và password đúng', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.message).toBe('Login successfully');
      expect(result.accessToken).toBe('mocked_jwt_token');
    });

    it('Nên ném UnauthorizedException (401) khi email không tồn tại', async () => {
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        authService.login({ email: 'wrong@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('Nên ném UnauthorizedException (401) khi password không chính xác', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      await expect(
        authService.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('3. Xác thực JWT Guard (JwtStrategy)', () => {
    it('Nên trả về đối tượng user hợp lệ từ token payload', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const payload = { sub: '507f1f77bcf86cd799439011', email: 'test@example.com' };
      const user = await jwtStrategy.validate(payload);

      expect(user).toEqual(mockUser);
    });

    it('Nên ném UnauthorizedException khi user không tồn tại trong DB', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const payload = { sub: '507f1f77bcf86cd799439011', email: 'invalid@example.com' };
      await expect(jwtStrategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });
  });
});
