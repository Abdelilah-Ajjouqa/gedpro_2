import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { mongodbConfig } from './config/mongodb.config';
import { postgresConfig } from './config/postgres.config';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: mongodbConfig,
      inject: [ConfigService],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: postgresConfig,
      inject: [ConfigService],
    }),

    UsersModule,
    DocumentsModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
