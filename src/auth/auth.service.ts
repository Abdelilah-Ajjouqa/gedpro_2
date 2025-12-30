import { HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from 'src/users/dto/createUser.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private userService: UsersService,
        private readonly configService: ConfigService
    ) { }

    private async signToken(userId: number, email: string) {
        const secret = this.configService.getOrThrow('JWT_SECRET');
        return jwt.sign(
            { id: userId, email },
            secret,
            { expiresIn: '1d' }
        );
    }

    async register(createUserDto: CreateUserDto) {
        const { email, password, ...rest } = createUserDto;

        const existingUser = await this.userService.findByEmail(email);
        if (existingUser) {
            throw new HttpException('User with this email already exists', 409);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const savedUser = await this.userService.create({
            ...rest,
            email,
            password: hashedPassword,
        } as any);

        const token = await this.signToken(savedUser.id, savedUser.email);

        const { password: _, ...result } = savedUser;
        return { user: result, token };
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        const user = await this.userService.findByEmail(email);
        if (!user) throw new UnauthorizedException('Invalid credentials');


        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new UnauthorizedException('Invalid credentials');


        const token = await this.signToken(user.id, user.email);

        const { password: _, ...result } = user;
        return { user: result, token };
    }
}