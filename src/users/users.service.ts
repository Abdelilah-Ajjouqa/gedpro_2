import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { User } from './entities/user.entity';

import { CreateUserDto } from './dto/createUser.dto';
import * as bcrypt from 'bcrypt';
import { SecurityAuditService } from '../auth/security-audit.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private readonly audit: SecurityAuditService,
    ) { }

    async create(userData: CreateUserDto | DeepPartial<User>) {
        if ('confirmPassword' in userData) {
            if (userData.password !== userData.confirmPassword) {
                throw new BadRequestException('Passwords do not match');
            }
            userData = {
                ...userData,
                password: await bcrypt.hash(userData.password, 12),
            };
            delete (userData as Partial<CreateUserDto>).confirmPassword;
        }
        const user = this.userRepository.create(userData);
        const saved = await this.userRepository.save(user);
        await this.audit.record('account.created', saved.id, undefined, { role: saved.role });
        return saved;
    }

    async findAll() {
        return await this.userRepository.find();
    }

    async findOne(id: number) {
        return await this.userRepository.findOne({ where: { id } });
    }

    async findByEmail(email: string) {
        return await this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .addSelect('user.failedLoginAttempts')
            .addSelect('user.lockedUntil')
            .where('user.email = :email', { email })
            .getOne();
    }

    async findAuthUser(id: number) {
        return this.userRepository.createQueryBuilder('user').addSelect('user.password')
            .addSelect('user.failedLoginAttempts').addSelect('user.lockedUntil')
            .where('user.id = :id', { id }).getOne();
    }

    async update(id: number, updateData: Partial<User>) {
        await this.userRepository.update(id, updateData);
        await this.audit.record('account.updated', id, undefined, { fields: Object.keys(updateData) });
        return this.findOne(id);
    }

    async remove(id: number) {
        await this.audit.record('account.deleted', id);
        return await this.userRepository.delete(id);
    }
}
