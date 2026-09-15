import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guard/auth.guard';
import { Roles } from '../auth/decorator/auth.decorator';
import { Role } from '../users/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiProtected } from '../common/swagger/api-protected.decorator';

@ApiTags('Interviews')
@ApiProtected()
@Controller('interviews')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule an interview' })
  @Roles(Role.RH, Role.ADMIN, Role.MANAGER)
  create(@Body() createInterviewDto: CreateInterviewDto, @Req() req: any) {
    return this.interviewsService.create(createInterviewDto, req.user as User);
  }

  @Get()
  @ApiOperation({ summary: 'List interviews' })
  @Roles(Role.RH, Role.ADMIN, Role.MANAGER)
  findAll() {
    return this.interviewsService.findAll();
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an interview' })
  @Roles(Role.RH, Role.ADMIN, Role.MANAGER)
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.interviewsService.cancel(+id, req.user as User);
  }
}
