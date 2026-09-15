import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import * as jwt from 'jsonwebtoken';
import { IsNull, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { Role } from '../users/enums/role.enum';
import { LoginDto, RegisterDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/token.dto';
import { AuthSession } from './entities/auth-session.entity';
import { AuthActionToken, AuthActionTokenType } from './entities/auth-action-token.entity';
import { SecurityAuditService } from './security-audit.service';

@Injectable()
export class AuthService {
  constructor(private readonly users: UsersService, private readonly config: ConfigService,
    @InjectRepository(AuthSession) private readonly sessions: Repository<AuthSession>,
    @InjectRepository(AuthActionToken) private readonly actionTokens: Repository<AuthActionToken>,
    private readonly audit: SecurityAuditService) {}

  private hash(token: string) { return createHash('sha256').update(token).digest('hex'); }
  private seconds(name: string, fallback: number) { return Number(this.config.get(name) ?? fallback); }
  private accessToken(user: { id: number; email: string }) {
    return jwt.sign({ id: user.id, email: user.email, type: 'access' }, this.config.getOrThrow<string>('JWT_SECRET'), { expiresIn: this.seconds('ACCESS_TOKEN_TTL_SECONDS', 900) });
  }
  private async issueTokens(user: { id: number; email: string }) {
    const ttl = this.seconds('REFRESH_TOKEN_TTL_SECONDS', 604800);
    const session = await this.sessions.save(this.sessions.create({ user: { id: user.id }, refreshTokenHash: 'pending', expiresAt: new Date(Date.now() + ttl * 1000), revokedAt: null }));
    const refreshToken = jwt.sign({ sub: user.id, sid: session.id, jti: randomUUID(), type: 'refresh' }, this.config.getOrThrow<string>('JWT_REFRESH_SECRET'), { expiresIn: ttl });
    session.refreshTokenHash = this.hash(refreshToken);
    await this.sessions.save(session);
    const accessToken = this.accessToken(user);
    return { accessToken, refreshToken, token: accessToken, expiresIn: this.seconds('ACCESS_TOKEN_TTL_SECONDS', 900) };
  }
  private publicUser(user: any) { const { password: _p, failedLoginAttempts: _f, lockedUntil: _l, ...safe } = user; return safe; }

  async register(dto: RegisterDto, ip?: string) {
    if (dto.password !== dto.confirmPassword) throw new BadRequestException('Passwords do not match');
    if (await this.users.findByEmail(dto.email.toLowerCase())) throw new ConflictException('User with this email already exists');
    const { confirmPassword: _, ...input } = dto;
    const user = await this.users.create({ ...input, email: dto.email.toLowerCase(), password: await bcrypt.hash(dto.password, 12), role: Role.CANDIDATE });
    await this.audit.record('account.registered', user.id, ip);
    return { user: this.publicUser(user), ...(await this.issueTokens(user)) };
  }
  async login(dto: LoginDto, ip?: string) {
    const user = await this.users.findByEmail(dto.email.toLowerCase());
    if (user?.lockedUntil && user.lockedUntil > new Date()) { await this.audit.record('login.locked', user.id, ip); throw new HttpException('Account temporarily locked', HttpStatus.TOO_MANY_REQUESTS); }
    if (!user || !user.isActive || !(await bcrypt.compare(dto.password, user.password))) {
      if (user) {
        const attempts = user.failedLoginAttempts + 1; const max = this.seconds('LOGIN_MAX_ATTEMPTS', 5);
        await this.users.update(user.id, { failedLoginAttempts: attempts >= max ? 0 : attempts, lockedUntil: attempts >= max ? new Date(Date.now() + this.seconds('LOGIN_LOCKOUT_SECONDS', 900) * 1000) : null });
        await this.audit.record(attempts >= max ? 'login.account_locked' : 'login.failed', user.id, ip);
      } else await this.audit.record('login.failed', null, ip);
      throw new UnauthorizedException('Email or password incorrect');
    }
    await this.users.update(user.id, { failedLoginAttempts: 0, lockedUntil: null });
    await this.audit.record('login.succeeded', user.id, ip);
    return { user: this.publicUser(user), ...(await this.issueTokens(user)) };
  }
  async refresh(token: string, ip?: string) {
    let payload: any; try { payload = jwt.verify(token, this.config.getOrThrow<string>('JWT_REFRESH_SECRET')); } catch { throw new UnauthorizedException('Invalid refresh token'); }
    if (payload.type !== 'refresh') throw new UnauthorizedException('Invalid refresh token');
    const session = await this.sessions.findOne({ where: { id: payload.sid }, relations: { user: true }, select: { id: true, refreshTokenHash: true, expiresAt: true, revokedAt: true, user: { id: true, email: true, isActive: true } } });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || this.hash(token) !== session.refreshTokenHash || !session.user.isActive) {
      if (session) await this.sessions.update(session.id, { revokedAt: new Date() });
      await this.audit.record('refresh.reuse_or_invalid', payload.sub ?? null, ip); throw new UnauthorizedException('Invalid refresh token');
    }
    await this.sessions.update(session.id, { revokedAt: new Date() }); await this.audit.record('refresh.rotated', session.user.id, ip);
    return this.issueTokens(session.user);
  }
  async logout(token: string, ip?: string) {
    const session = await this.sessions.findOne({ where: { refreshTokenHash: this.hash(token), revokedAt: IsNull() }, relations: { user: true }, select: { id: true, user: { id: true } } });
    if (session) { await this.sessions.update(session.id, { revokedAt: new Date() }); await this.audit.record('logout', session.user.id, ip); }
  }
  async requestAction(email: string, type: AuthActionTokenType, ip?: string) {
    const user = await this.users.findByEmail(email.toLowerCase());
    if (user) {
      await this.actionTokens.update({ user: { id: user.id }, type, usedAt: IsNull() }, { usedAt: new Date() });
      const raw = randomBytes(32).toString('base64url');
      await this.actionTokens.save(this.actionTokens.create({ user: { id: user.id }, tokenHash: this.hash(raw), type, expiresAt: new Date(Date.now() + this.seconds('ACTION_TOKEN_TTL_SECONDS', 1800) * 1000), usedAt: null }));
      await this.audit.record(`${type}.requested`, user.id, ip);
    }
    return { message: 'If the account exists, instructions will be sent.' };
  }
  private async consumeAction(raw: string, type: AuthActionTokenType) {
    const token = await this.actionTokens.findOne({ where: { tokenHash: this.hash(raw), type, usedAt: IsNull() }, relations: { user: true }, select: { id: true, expiresAt: true, user: { id: true, email: true } } });
    if (!token || token.expiresAt <= new Date()) throw new BadRequestException('Token is invalid or expired');
    await this.actionTokens.update(token.id, { usedAt: new Date() }); return token.user;
  }
  async resetPassword(dto: ResetPasswordDto, ip?: string) {
    if (dto.password !== dto.confirmPassword) throw new BadRequestException('Passwords do not match');
    const user = await this.consumeAction(dto.token, AuthActionTokenType.PASSWORD_RESET);
    await this.users.update(user.id, { password: await bcrypt.hash(dto.password, 12), failedLoginAttempts: 0, lockedUntil: null });
    await this.sessions.update({ user: { id: user.id }, revokedAt: IsNull() }, { revokedAt: new Date() });
    await this.audit.record('password_reset.completed', user.id, ip); return { message: 'Password reset successfully' };
  }
  async verifyEmail(raw: string, ip?: string) {
    const user = await this.consumeAction(raw, AuthActionTokenType.EMAIL_VERIFICATION);
    await this.users.update(user.id, { emailVerified: true }); await this.audit.record('email_verification.completed', user.id, ip);
    return { message: 'Email verified successfully' };
  }
}
