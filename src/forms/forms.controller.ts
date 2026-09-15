import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guard/auth.guard';
import { Roles } from '../auth/decorator/auth.decorator';
import { Role } from '../users/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiProtected } from '../common/swagger/api-protected.decorator';

@ApiTags('Forms')
@ApiProtected()
@Controller('forms')
export class FormsController {
    constructor(private readonly formsService: FormsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a dynamic form' })
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.RH, Role.ADMIN)
    create(@Body() createFormDto: CreateFormDto, @Req() req: any) {
        return this.formsService.createForm(createFormDto, req.user as User);
    }

    @Get()
    @ApiOperation({ summary: 'List dynamic forms' })
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.RH, Role.ADMIN, Role.MANAGER)
    findAll() {
        return this.formsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a dynamic form' })
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.RH, Role.ADMIN, Role.MANAGER, Role.CANDIDATE)
    findOne(@Param('id') id: string) {
        return this.formsService.findOne(id);
    }

    @Post(':id/submit')
    @ApiOperation({ summary: 'Submit answers to a dynamic form' })
    @UseGuards(AuthGuard('jwt'), RolesGuard) // Optional: allow public submission? For now, restrict.
    // @Roles(Role.CANDIDATE, Role.RH) // Or any user
    submit(@Param('id') id: string, @Body() submitResponseDto: SubmitResponseDto, @Req() req: any) {
        return this.formsService.submitResponse(id, submitResponseDto, req.user as User);
    }
}
