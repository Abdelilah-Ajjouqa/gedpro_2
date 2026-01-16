import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
// import { Permission } from '../users/entities/permissions.entity';
// import { Role } from '../users/entities/role.entity';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    console.log('Starting Smart Seeding...');

    // Seed logic removed as Roles are now Enums and hardcoded. 
    // You can add User seeding here if needed (e.g. create a default Admin).

    console.log('Seeding Complete!');

    console.log('Seeding Complete!');
    await app.close();
}
bootstrap();