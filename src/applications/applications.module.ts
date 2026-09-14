import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationHistory } from './entities/application-history.entity';
import { Application } from './entities/application.entity';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

@Module({ imports: [TypeOrmModule.forFeature([Application, ApplicationHistory])], controllers: [ApplicationsController], providers: [ApplicationsService] })
export class ApplicationsModule {}
