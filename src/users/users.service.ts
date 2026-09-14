import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { User } from './entities/user.entity';

import { CreateUserDto } from './dto/createUser.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
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
        return await this.userRepository.save(user);
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
            .where('user.email = :email', { email })
            .getOne();
    }

    async update(id: number, updateData: Partial<User>) {
        await this.userRepository.update(id, updateData);
        return this.findOne(id);
    }

    async remove(id: number) {
        return await this.userRepository.delete(id);
    }
}
