import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/login.dto';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../common/swagger/api-error.dto';
import {
  LogoutDto,
  RefreshTokenDto,
  RequestEmailVerificationDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/token.dto';
import { AuthActionTokenType } from './entities/auth-action-token.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a candidate account' })
  @ApiCreatedResponse({
    description: 'Candidate account and access token created',
  })
  @ApiBadRequestResponse({
    description: 'Invalid registration data or password mismatch',
    type: ApiErrorDto,
  })
  @ApiConflictResponse({
    description: 'Email address is already registered',
    type: ApiErrorDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: RegisterDto, @Req() req: any) {
    return await this.authService.register(createUserDto, req.ip);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiOkResponse({ description: 'Authenticated user and access token' })
  @ApiUnauthorizedResponse({
    description: 'Email or password is incorrect',
    type: ApiErrorDto,
  })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    return await this.authService.login(loginDto, req.ip);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate a refresh token' })
  @ApiOkResponse({ description: 'New access and refresh token pair' })
  @ApiUnauthorizedResponse({
    description: 'Refresh token is invalid, expired, revoked, or reused',
    type: ApiErrorDto,
  })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: any) {
    return this.authService.refresh(dto.refreshToken, req.ip);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a refresh-token session' })
  logout(@Body() dto: LogoutDto, @Req() req: any) {
    return this.authService.logout(dto.refreshToken, req.ip);
  }

  @Post('password-reset/request')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request password-reset instructions' })
  requestReset(@Body() dto: RequestPasswordResetDto, @Req() req: any) {
    return this.authService.requestAction(
      dto.email,
      AuthActionTokenType.PASSWORD_RESET,
      req.ip,
    );
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset a password using a single-use token' })
  reset(@Body() dto: ResetPasswordDto, @Req() req: any) {
    return this.authService.resetPassword(dto, req.ip);
  }

  @Post('email-verification/request')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request email-verification instructions' })
  requestVerification(
    @Body() dto: RequestEmailVerificationDto,
    @Req() req: any,
  ) {
    return this.authService.requestAction(
      dto.email,
      AuthActionTokenType.EMAIL_VERIFICATION,
      req.ip,
    );
  }

  @Post('email-verification/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email using a single-use token' })
  verify(@Body() dto: VerifyEmailDto, @Req() req: any) {
    return this.authService.verifyEmail(dto.token, req.ip);
  }
}
