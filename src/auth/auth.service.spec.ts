import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthService security rules', () => {
  const user: any = { id: 1, email: 'user@example.com', password: '', role: 'candidate', isActive: true, failedLoginAttempts: 0, lockedUntil: null };
  let users: any; let sessions: any; let actions: any; let audit: any; let service: AuthService;
  beforeEach(async () => {
    user.password = await bcrypt.hash('correct-password', 4);
    users = { findByEmail: jest.fn().mockResolvedValue(user), create: jest.fn(), update: jest.fn() };
    sessions = { create: jest.fn((x) => x), save: jest.fn(async (x) => ({ id: x.id ?? 'session-1', ...x })), findOne: jest.fn(), update: jest.fn() };
    actions = { create: jest.fn((x) => x), save: jest.fn(), update: jest.fn(), findOne: jest.fn() };
    audit = { record: jest.fn() };
    const config: any = { get: jest.fn((_k: string) => undefined), getOrThrow: jest.fn((k: string) => k === 'JWT_SECRET' ? 'a'.repeat(40) : 'b'.repeat(40)) };
    service = new AuthService(users, config, sessions, actions, audit);
  });

  it('rotates refresh tokens and revokes the previous session', async () => {
    const loggedIn = await service.login({ email: user.email, password: 'correct-password' });
    sessions.findOne.mockResolvedValue({ id: 'session-1', refreshTokenHash: require('crypto').createHash('sha256').update(loggedIn.refreshToken).digest('hex'), expiresAt: new Date(Date.now() + 10000), revokedAt: null, user });
    const rotated = await service.refresh(loggedIn.refreshToken);
    expect(rotated.refreshToken).not.toBe(loggedIn.refreshToken);
    expect(sessions.update).toHaveBeenCalledWith('session-1', { revokedAt: expect.any(Date) });
  });

  it('rejects reuse of a revoked refresh token', async () => {
    const loggedIn = await service.login({ email: user.email, password: 'correct-password' });
    sessions.findOne.mockResolvedValue({ id: 'session-1', revokedAt: new Date(), expiresAt: new Date(Date.now() + 10000), refreshTokenHash: 'unused', user });
    await expect(service.refresh(loggedIn.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('does not reveal whether a reset email exists', async () => {
    users.findByEmail.mockResolvedValueOnce(null);
    await expect(service.requestAction('missing@example.com', 'password_reset' as any)).resolves.toEqual({ message: 'If the account exists, instructions will be sent.' });
    expect(actions.save).not.toHaveBeenCalled();
  });

  it('locks an account after repeated bad passwords', async () => {
    user.failedLoginAttempts = 4;
    await expect(service.login({ email: user.email, password: 'wrong-password' })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(users.update).toHaveBeenCalledWith(user.id, expect.objectContaining({ lockedUntil: expect.any(Date), failedLoginAttempts: 0 }));
  });

  it('consumes an email-verification token only once', async () => {
    actions.findOne.mockResolvedValueOnce({ id: 'action-1', expiresAt: new Date(Date.now() + 10000), user });
    await expect(service.verifyEmail('opaque-token')).resolves.toEqual({ message: 'Email verified successfully' });
    expect(actions.update).toHaveBeenCalledWith('action-1', { usedAt: expect.any(Date) });
    actions.findOne.mockResolvedValueOnce(null);
    await expect(service.verifyEmail('opaque-token')).rejects.toThrow('Token is invalid or expired');
  });

  it('resets a password and revokes all active sessions', async () => {
    actions.findOne.mockResolvedValue({ id: 'action-2', expiresAt: new Date(Date.now() + 10000), user });
    await service.resetPassword({ token: 'opaque-token', password: 'new-password-123', confirmPassword: 'new-password-123' });
    expect(users.update).toHaveBeenCalledWith(user.id, expect.objectContaining({ password: expect.any(String) }));
    expect(sessions.update).toHaveBeenCalledWith(expect.objectContaining({ user: { id: user.id } }), { revokedAt: expect.any(Date) });
  });
});
