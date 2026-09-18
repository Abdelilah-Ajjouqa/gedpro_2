import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('Starting Smart Seeding...');

  // Seed logic removed as Roles are now Enums and hardcoded.
  // You can add User seeding here if needed (e.g. create a default Admin).

  console.log('Seeding Complete!');
  await app.close();
}
void bootstrap();
