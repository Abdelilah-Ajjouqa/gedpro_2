import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/login.dto';
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiErrorDto } from '../common/swagger/api-error.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a candidate account' })
    @ApiCreatedResponse({ description: 'Candidate account and access token created' })
    @ApiBadRequestResponse({ description: 'Invalid registration data or password mismatch', type: ApiErrorDto })
    @ApiConflictResponse({ description: 'Email address is already registered', type: ApiErrorDto })
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() createUserDto: RegisterDto) {
        return await this.authService.register(createUserDto);
    }

    @Post('login')
    @ApiOperation({ summary: 'Log in with email and password' })
    @ApiOkResponse({ description: 'Authenticated user and access token' })
    @ApiUnauthorizedResponse({ description: 'Email or password is incorrect', type: ApiErrorDto })
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        return await this.authService.login(loginDto);
    }
}
