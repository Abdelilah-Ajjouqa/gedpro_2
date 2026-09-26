import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Brackets, DeepPartial, IsNull, Repository } from 'typeorm';
import { AuthSession } from '../auth/entities/auth-session.entity';
import { SecurityAuditService } from '../auth/security-audit.service';
import { User } from './entities/user.entity';
import {
  CreateUserDto,
  ListUsersDto,
  UpdateUserDto,
  UserDto,
} from './dto/createUser.dto';
import { Role } from './enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(AuthSession)
    private readonly sessions: Repository<AuthSession>,
    private readonly audit: SecurityAuditService,
  ) {}

  toDto(user: User): UserDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
  async create(userData: DeepPartial<User>) {
    return this.users.save(this.users.create(userData));
  }
  async createManaged(dto: CreateUserDto, actorId: number) {
    const email = dto.email.trim().toLowerCase();
    if (await this.findByEmail(email))
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account already uses this email address.',
      });
    // Provisioned accounts stay inactive until the approved invitation/set-password flow completes.
    const user = await this.create({
      ...dto,
      email,
      isActive: false,
      emailVerified: false,
      password: await bcrypt.hash(`${Date.now()}-${Math.random()}`, 12),
    });
    await this.audit.record('account.provisioned', user.id, undefined, {
      actorId,
      after: { role: user.role, isActive: false },
    });
    return this.toDto(user);
  }
  async findAllSafe(query: ListUsersDto) {
    const page = query.page ?? 1,
      limit = query.limit ?? 20;
    const qb = this.users.createQueryBuilder('user');
    if (query.q) {
      const q = `%${query.q.trim()}%`;
      qb.andWhere(
        new Brackets((where) =>
          where
            .where('lower(user.firstName) LIKE lower(:q)', { q })
            .orWhere('lower(user.lastName) LIKE lower(:q)', { q })
            .orWhere('lower(user.email) LIKE lower(:q)', { q }),
        ),
      );
    }
    if (query.role) qb.andWhere('user.role = :role', { role: query.role });
    if (query.active !== undefined)
      qb.andWhere('user.isActive = :active', { active: query.active });
    const [records, total] = await qb
      .orderBy('user.createdAt', 'DESC')
      .addOrderBy('user.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      data: records.map(
        ({ id, firstName, lastName, email, role, isActive, createdAt }) => ({
          id,
          firstName,
          lastName,
          email,
          role,
          isActive,
          createdAt,
        }),
      ),
      total,
      page,
      limit,
    };
  }
  async findOne(id: number) {
    return this.users.findOne({ where: { id } });
  }
  async findOneSafe(id: number) {
    const user = await this.findOne(id);
    if (!user)
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found.',
      });
    return this.toDto(user);
  }
  async findByEmail(email: string) {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.password')
      .addSelect('user.failedLoginAttempts')
      .addSelect('user.lockedUntil')
      .where('lower(user.email) = lower(:email)', { email })
      .getOne();
  }
  async findAuthUser(id: number) {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.password')
      .addSelect('user.failedLoginAttempts')
      .addSelect('user.lockedUntil')
      .where('user.id = :id', { id })
      .getOne();
  }
  async update(id: number, updateData: Partial<User>) {
    await this.users.update(id, updateData);
    return this.findOne(id);
  }
  private async assertManagedChange(
    target: User,
    actorId: number,
    changingRoleOrState: boolean,
  ) {
    if (target.id === actorId)
      throw new ConflictException({
        code: 'SELF_ACTION_FORBIDDEN',
        message: 'You cannot change your own access through administration.',
      });
    if (changingRoleOrState && target.role === Role.ADMIN) {
      const activeAdmins = await this.users.count({
        where: { role: Role.ADMIN, isActive: true },
      });
      if (activeAdmins <= 1)
        throw new ConflictException({
          code: 'LAST_ACTIVE_ADMIN',
          message: 'At least one active administrator must remain.',
        });
    }
  }
  async updateManaged(id: number, dto: UpdateUserDto, actorId: number) {
    const target = await this.findOne(id);
    if (!target)
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found.',
      });
    await this.assertManagedChange(
      target,
      actorId,
      dto.role !== undefined && dto.role !== target.role,
    );
    if (dto.email) {
      dto.email = dto.email.trim().toLowerCase();
      const existing = await this.findByEmail(dto.email);
      if (existing && existing.id !== id)
        throw new ConflictException({
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account already uses this email address.',
        });
    }
    await this.update(id, dto);
    const updated = await this.findOneSafe(id);
    await this.audit.record('account.updated', id, undefined, {
      actorId,
      fields: Object.keys(dto),
      after: { role: updated.role },
    });
    return updated;
  }
  async setActive(
    id: number,
    active: boolean,
    reason: string,
    actorId: number,
  ) {
    const target = await this.findOne(id);
    if (!target)
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found.',
      });
    await this.assertManagedChange(target, actorId, target.isActive !== active);
    if (target.isActive === active)
      throw new ConflictException({
        code: 'USER_STATE_CONFLICT',
        message: active
          ? 'The account is already active.'
          : 'The account is already inactive.',
      });
    await this.users.manager.transaction(async (manager) => {
      await manager.getRepository(User).update(id, { isActive: active });
      await manager
        .getRepository(AuthSession)
        .update(
          { user: { id }, revokedAt: IsNull() },
          { revokedAt: new Date() },
        );
    });
    const updated = await this.findOneSafe(id);
    await this.audit.record(
      active ? 'account.activated' : 'account.deactivated',
      id,
      undefined,
      {
        actorId,
        reason,
        before: { isActive: target.isActive },
        after: { isActive: active },
      },
    );
    return updated;
  }
  async remove(id: number) {
    return this.users.delete(id);
  }
}
