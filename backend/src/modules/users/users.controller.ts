import { Controller, Get, Param } from '@nestjs/common';
import { User } from '../../schemas/user.schema';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService){}
    @Get(':email')
    async getAllUsers(@Param('email')email:string): Promise<User|null> {
        return this.usersService.findByEmail(email);
    }
}
