import { AuthService } from '../src/modules/auth/auth.service';
import { JwtStrategy } from '../src/modules/auth/strategies/jwt.strategy';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

async function runAuthTests() {
  console.log('====================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG: REGISTER, LOGIN & JWT GUARD');
  console.log('====================================================\n');

  let testPassed = 0;
  let testFailed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(` ✅ PASS: ${testName}`);
      testPassed++;
    } else {
      console.log(` ❌ FAIL: ${testName}`);
      testFailed++;
    }
  }

  // Mock In-Memory Database
  const usersDb: Record<string, any> = {};

  const mockUserModel: any = {
    findOne: (filter: { email: string }) => ({
      exec: async () => usersDb[filter.email] || null,
      select: () => ({
        exec: async () => usersDb[filter.email] || null,
      }),
    }),
    create: async (data: any) => {
      const newUser = { _id: 'user_id_12345', ...data };
      usersDb[data.email] = newUser;
      return newUser;
    },
  };

  const mockJwtService: any = {
    sign: (payload: any) => `mocked_jwt_token_for_${payload.email}`,
    verifyAsync: async (token: string) => true,
  };

  const mockUsersService: any = {
    findByEmail: async (email: string) => usersDb[email] || null,
  };

  // Instantiate services
  const authService = new (AuthService as any)();
  authService.userModel = mockUserModel;
  authService.jwtService = mockJwtService;

  const jwtStrategy = new JwtStrategy(mockUsersService);

  // ---------------------------------------------------------
  // TEST CASE 1: Đăng ký tài khoản mới hợp lệ
  // ---------------------------------------------------------
  try {
    const registerRes = await authService.register({
      email: 'hr@smarthr.com',
      password: 'SecurePassword123',
      fullName: 'HR Manager',
      role: 'HR_MANAGER' as any,
    });

    assert(
      registerRes.message === 'Register successfully' &&
        registerRes.user.email === 'hr@smarthr.com' &&
        typeof registerRes.accessToken === 'string',
      '1.1. Đăng ký tài khoản mới thành công -> Trả về User & AccessToken',
    );
  } catch (err: any) {
    assert(false, `1.1. Đăng ký thất bại: ${err.message}`);
  }

  // ---------------------------------------------------------
  // TEST CASE 2: Đăng ký trùng Email (Kỳ vọng ConflictException 409)
  // ---------------------------------------------------------
  try {
    await authService.register({
      email: 'hr@smarthr.com',
      password: 'SecurePassword123',
      fullName: 'HR Manager 2',
    });
    assert(false, '1.2. Đăng ký trùng email phải ném lỗi ConflictException');
  } catch (err: any) {
    assert(
      err instanceof ConflictException && err.message === 'Email already exists',
      '1.2. Đăng ký trùng Email -> Ném lỗi ConflictException (409)',
    );
  }

  // ---------------------------------------------------------
  // TEST CASE 3: Đăng nhập thành công với Password đúng
  // ---------------------------------------------------------
  try {
    const loginRes = await authService.login({
      email: 'hr@smarthr.com',
      password: 'SecurePassword123',
    });

    assert(
      loginRes.message === 'Login successfully' &&
        loginRes.user.email === 'hr@smarthr.com' &&
        loginRes.accessToken === 'mocked_jwt_token_for_hr@smarthr.com',
      '2.1. Đăng nhập đúng thông tin -> Trả về AccessToken thành công',
    );
  } catch (err: any) {
    assert(false, `2.1. Đăng nhập thất bại: ${err.message}`);
  }

  // ---------------------------------------------------------
  // TEST CASE 4: Đăng nhập sai Mật khẩu (Kỳ vọng UnauthorizedException 401)
  // ---------------------------------------------------------
  try {
    await authService.login({
      email: 'hr@smarthr.com',
      password: 'WrongPassword999',
    });
    assert(false, '2.2. Đăng nhập sai password phải ném lỗi UnauthorizedException');
  } catch (err: any) {
    assert(
      err instanceof UnauthorizedException,
      '2.2. Đăng nhập sai mật khẩu -> Ném lỗi UnauthorizedException (401)',
    );
  }

  // ---------------------------------------------------------
  // TEST CASE 5: Đăng nhập sai Email (Kỳ vọng UnauthorizedException 401)
  // ---------------------------------------------------------
  try {
    await authService.login({
      email: 'nonexistent@smarthr.com',
      password: 'SecurePassword123',
    });
    assert(false, '2.3. Đăng nhập sai email phải ném lỗi UnauthorizedException');
  } catch (err: any) {
    assert(
      err instanceof UnauthorizedException,
      '2.3. Đăng nhập sai Email -> Ném lỗi UnauthorizedException (401)',
    );
  }

  // ---------------------------------------------------------
  // TEST CASE 6: JWT Guard (JwtStrategy.validate) với Payload hợp lệ
  // ---------------------------------------------------------
  try {
    const validPayload = { sub: 'user_id_12345', email: 'hr@smarthr.com' };
    const authenticatedUser = await jwtStrategy.validate(validPayload);

    assert(
      authenticatedUser && authenticatedUser.email === 'hr@smarthr.com',
      '3.1. JwtStrategy giải mã Token & tìm User -> Gắn đối tượng User thành công',
    );
  } catch (err: any) {
    assert(false, `3.1. JwtStrategy validate thất bại: ${err.message}`);
  }

  // ---------------------------------------------------------
  // TEST CASE 7: JWT Guard (JwtStrategy.validate) với User không tồn tại
  // ---------------------------------------------------------
  try {
    const invalidPayload = { sub: 'fake_user_id', email: 'unknown@smarthr.com' };
    await jwtStrategy.validate(invalidPayload);
    assert(false, '3.2. JwtStrategy với user không tồn tại phải ném lỗi UnauthorizedException');
  } catch (err: any) {
    assert(
      err instanceof UnauthorizedException,
      '3.2. JwtStrategy với User không tồn tại -> Ném lỗi UnauthorizedException (401)',
    );
  }

  console.log('\n====================================================');
  console.log(`📊 TỔNG KẾT KẾT QUẢ KIỂM THỬ: ${testPassed}/${testPassed + testFailed} PASSED`);
  console.log('====================================================');

  if (testFailed > 0) {
    process.exit(1);
  }
}

runAuthTests().catch((err) => {
  console.error('Lỗi khi chạy test:', err);
  process.exit(1);
});
