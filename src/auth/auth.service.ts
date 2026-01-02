import { HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from 'src/users/dto/createUser.dto';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/users/entities/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
    constructor(
        private userService: UsersService,
        private readonly configService: ConfigService,
        @InjectRepository(Role)
        private roleRepository: Repository<Role>,
    ) { }

    private async generateToken(payload: { id: number, email: string }) {
        return jwt.sign(payload, this.configService.getOrThrow<string>('JWT_SECRET'), {
            expiresIn: '1d'
        });
    }

    async register(createUserDto: CreateUserDto) {
        const { email, password, ...rest } = createUserDto;

        // 1. Check if user already exists
        const isUserExist = await this.userService.findByEmail(email);
        if (isUserExist) {
            throw new HttpException('User with this email already exists', 409);
        }

        // 2. Fetch the Default Role (Candidate) from the DB
        // This ensures every new user has permissions defined in your Seed Script
        const defaultRole = await this.roleRepository.findOne({ where: { name: 'Candidate' } });

        if (!defaultRole) {
            throw new HttpException('System Error: Default role (Candidate) not found. Please run seed.', 500);
        }

        // 3. Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Create the User Object with the Role
        const newUser = {
            ...rest,
            email,
            password: hashedPassword,
            role: defaultRole, // <--- CRITICAL: Linking the Entity
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // 5. Save using UsersService
        // (Ensure UsersService.create accepts the role property, or cast as any for now)
        const savedUser = await this.userService.create(newUser as any);

        // 6. Generate Token
        const token = await this.generateToken({
            id: savedUser.id,
            email: savedUser.email
        });

        return {
            user: {
                id: savedUser.id,
                email: savedUser.email,
                role: savedUser.role, // Return role so frontend can hide/show buttons
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