import { HttpException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from 'src/users/dto/createUser.dto';

interface TokenPayload {
    firstName: string;
    lastName: string;
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
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            const savedUser = await this.userService.create(newUser);
            const token = await this.generateToken({ firstName, lastName, email });

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
}
