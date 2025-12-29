import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

interface createUserInterface {
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    createdAt: number,
    updatedAt: number,
}
@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async create(userData: createUserInterface) {
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
        return await this.userRepository.findOne({ where: { email } });
    }

    async update(id: number, updateData: Partial<User>) {
        await this.userRepository.update(id, updateData);
        return this.findOne(id);
    }

    async remove(id: number) {
        return await this.userRepository.delete(id);
    }
}
