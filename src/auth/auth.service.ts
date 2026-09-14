import { HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from 'src/users/dto/createUser.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from 'src/users/enums/role.enum';

@Injectable()
export class AuthService {
    constructor(
        private userService: UsersService,
        private readonly configService: ConfigService,
    ) { }

    private async generateToken(payload: { id: number, email: string }) {
        return jwt.sign(payload, this.configService.getOrThrow<string>('JWT_SECRET'), {
            expiresIn: '1d'
        });
    }

    async register(createUserDto: CreateUserDto) {
        const { email, password, confirmPassword: _, ...rest } = createUserDto;

        if (password !== createUserDto.confirmPassword) {
            throw new HttpException('Passwords do not match', 400);
        }

        // 1. Check if user already exists
        const isUserExist = await this.userService.findByEmail(email);
        if (isUserExist) {
            throw new HttpException('User with this email already exists', 409);
        }

        // 2. Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Create the User Object with the Role
        const newUser = {
            ...rest,
            email,
            password: hashedPassword,
            role: Role.CANDIDATE,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // 4. Save using UsersService
        const savedUser = await this.userService.create(newUser);

        // 5. Generate Token
        const token = await this.generateToken({
            id: savedUser.id,
            email: savedUser.email
        });

        return {
            user: {
                id: savedUser.id,
                email: savedUser.email,
                role: savedUser.role,
            },
            token,
        };
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // 1. Find User 
        // (Because we used { eager: true } in User entity, this fetches Role + Permissions too)
        const user = await this.userService.findByEmail(email);

        if (!user) throw new UnauthorizedException('Email or password incorrect');

        // 2. Validate Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Email or password incorrect');
        }

        // 3. Generate Token
        const token = await this.generateToken({
            id: user.id,
            email: user.email
        });

        // 4. Return User (excluding password)
        const { password: _, ...result } = user;

        return {
            user: result,
            token,
        };
    }
}
