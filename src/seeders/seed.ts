import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Permission } from '../users/entities/permissions.entity';
import { Role } from '../users/entities/role.entity';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    const permissionRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(Role);

    console.log('Starting Smart Seeding...');

    // Upsert Permissions
    const permissionsData = [
        { name: 'users:read', description: 'Can view users' },
        { name: 'users:create', description: 'Can create users' },
        { name: 'documents:upload', description: 'Can upload files' },
        { name: 'documents:read', description: 'Can view own documents' },
    ];

    const savedPermissions: Permission[] = [];
    for (const p of permissionsData) {
        let permission = await permissionRepo.findOneBy({ name: p.name });
        if (!permission) {
            permission = permissionRepo.create(p);
            console.log(`Created permission: ${p.name}`);
        } else {
            permission.description = p.description;
            console.log(`Found permission: ${p.name}`);
        }
        await permissionRepo.save(permission);
        savedPermissions.push(permission);
    }

    // Upsert Roles
    const rolesData = [
        {
            name: 'Admin',
            permissions: savedPermissions
        },
        {
            name: 'Candidate',
            permissions: savedPermissions.filter(p =>
                ['documents:upload', 'documents:read'].includes(p.name)
            )
        }
    ];

    for (const r of rolesData) {
        let role = await roleRepo.findOneBy({ name: r.name });
        if (!role) {
            role = roleRepo.create({ name: r.name });
            console.log(`Creating role: ${r.name}`);
        } else {
            console.log(`Updating role: ${r.name}`);
        }

        role.permissions = r.permissions;
        await roleRepo.save(role);
    }

    console.log('Seeding Complete!');
    await app.close();
}
bootstrap();