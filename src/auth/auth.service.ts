import { HttpException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from 'src/users/dto/createUser.dto';
import { LoginDto } from './dto/login.dto';

interface TokenPayload {
    id: number,
    email: string;
}

@Injectable()
export class AuthService {
    constructor(
        private userService: UsersService,
        private readonly configService: ConfigService
    ) { }

    private async generateToken(payload: TokenPayload): Promise<string> {
        const token = jwt.sign(payload, this.configService.getOrThrow<string>('JWT_SECRET'), {
            expiresIn: '1d'
        })
        return token;
    }

    async register(user: CreateUserDto) {
        const { firstName, lastName, email, password } = user;

        try {
            const isUserExist = await this.userService.findByEmail(email);

            if (isUserExist) {
                throw new HttpException('User with this email already exists', 409);
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const savedUser = await this.userService.create(newUser);
            const token = await this.generateToken({
                id: savedUser.id,
                email
            });

            return {
                user: {
                    id: savedUser.id,
                    firstName: savedUser.firstName,
                    lastName: savedUser.lastName,
                    email: savedUser.email,
                    createdAt: savedUser.createdAt,
                    updatedAt: savedUser.updatedAt
                },
                token,
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to register user', 500);
        }
    }

    async login(userData: LoginDto) {
        try {
            const { email, password } = userData;
            const user = await this.userService.findByEmail(email);

            if (!user) throw new HttpException('email or password incorrect', 401);

            if (!(await bcrypt.compare(password, user?.password))) {
                throw new HttpException('email or password incorrect', 401);
            }

            const token = await this.generateToken({
                id: user.id,
                email
            });
            return {
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                },
                token,
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException('Failed to login', 500)
        }
    }
}
