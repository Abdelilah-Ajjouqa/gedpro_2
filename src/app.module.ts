import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { mongodbConfig } from './config/mongodb.config';
import { postgresConfig } from './config/postgres.config';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './documents/documents.module';
import { CandidatesModule } from './candidates/candidates.module';
import { FormsModule } from './forms/forms.module';
import { InterviewsModule } from './interviews/interviews.module';
import { validateEnvironment } from './config/environment.validation';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnvironment,
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
    CandidatesModule,
    FormsModule,
    InterviewsModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
