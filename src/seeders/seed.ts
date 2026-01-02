import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { Permission } from 'src/users/entities/permissions.entity';
import { Role } from 'src/users/entities/role.entity';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    const permissionRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(Role);

    console.log('Starting Seeding');

    // Create Permissions
    const permissionsData = [
        { name: 'users:read', description: 'Can view users' },
        { name: 'users:create', description: 'Can create users' },
        { name: 'documents:upload', description: 'Can upload files' },
    ];

    const savedPermissions: Permission[] = [];
    for (const p of permissionsData) {
        let permission = await permissionRepo.findOneBy({ name: p.name });
        if (!permission) {
            permission = permissionRepo.create(p);
            await permissionRepo.save(permission);
            console.log(`Created permission: ${p.name}`);
        }
        savedPermissions.push(permission);
    }

    // Create Roles
    const rolesData = [
        {
            name: 'Admin',
            permissions: savedPermissions
        },
        {
            name: 'Candidate',
            permissions: savedPermissions.filter(p => p.name === 'documents:upload')
        }
    ];

    for (const r of rolesData) {
        let role = await roleRepo.findOneBy({ name: r.name });
        if (!role) {
            role = roleRepo.create({
                name: r.name,
                permissions: r.permissions
            });
            await roleRepo.save(role);
            console.log(`Created role: ${r.name}`);
        }
    }

    console.log('Seeding complete');
    await app.close();
}
bootstrap();