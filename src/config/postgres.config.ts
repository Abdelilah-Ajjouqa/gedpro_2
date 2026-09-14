import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const postgresConfig = async (
    configService: ConfigService,
): Promise<TypeOrmModuleOptions> => ({
    type: 'postgres',
    host: configService.getOrThrow<string>('POSTGRES_HOST'),
    port: configService.getOrThrow<number>('POSTGRES_PORT'),
    username: configService.getOrThrow<string>('POSTGRES_USER'),
    password: configService.getOrThrow<string>('POSTGRES_PASSWORD'),
    database: configService.getOrThrow<string>('POSTGRES_DB'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: configService.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    migrationsRun: configService.get<string>('DB_MIGRATIONS_RUN', 'true') === 'true',
});
