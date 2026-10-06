import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "../../users/users.service";

export interface JwtPayLoad{
    sub: string | number;
    email:  string
}
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(private readonly userService: UsersService){
        super({
           jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
           ignoreExpiration: false, 
           secretOrKey: process.env.JWT_SECRET || 'your-secret-key'
        })
    }

    async validate(payload: JwtPayLoad){
        const {email, sub} = payload;
        const user = await this.userService.findByEmail(email);
        if(!user){
            throw new UnauthorizedException('User is not existed or Token is invalid');
        }
        return user;
    }
}