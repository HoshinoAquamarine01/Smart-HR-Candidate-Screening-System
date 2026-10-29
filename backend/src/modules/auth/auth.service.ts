import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { Model } from 'mongoose';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>
    constructor(private readonly jwtService: JwtService) { }

    async register(registerDto: RegisterDto) {
        const { email, password, fullName, role, department } = registerDto;

        const existingUser = await this.userModel.findOne({ email }).exec();
        if (existingUser) {
            throw new ConflictException("Email already exists");
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await this.userModel.create({
            email,
            passwordHash,
            fullName,
            role: role || 'RECRUITER',
            department,
            status: 'ACTIVE',
        });

        const accessToken = this.generateToken(user._id.toString(), user.email, user.role);

        return {
            message: 'Register successfully',
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                department: user.department,
            },
            accessToken,
        };
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        const user = await this.userModel.findOne({ email }).select('+passwordHash').exec();
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const accessToken = this.generateToken(user._id.toString(), user.email, user.role);

        return {
            message: 'Login successfully',
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                department: user.department,
            },
            accessToken,
        };
    }
    async logout(token: string) {
        await this.jwtService.verifyAsync(token);
        return {
            message: 'Logout successfully',
        };
    }
    async getProfile(token: string) {
        await this.jwtService.verifyAsync(token);
        return {
            message: 'Get profile successfully',
        };
    }
    private generateToken(userId: string, email: string, role: string) {
        const payload = { sub: userId, id: userId, email, role };
        return this.jwtService.sign(payload);
    }
}
