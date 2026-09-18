import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiForbiddenResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorator/auth.decorator';
import { RolesGuard } from '../auth/guard/auth.guard';
import { ApiProtected } from '../common/swagger/api-protected.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import { CommunicationsService } from './communications.service';
import {
  CommunicationQueryDto,
  CreateTemplateDto,
  PreferenceDto,
  QueueCommunicationDto,
  WebhookDto,
} from './dto/communication.dto';

@ApiTags('Communications')
@ApiProtected()
@Controller('communications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CommunicationsController {
  constructor(private service: CommunicationsService) {}
  @Post('templates')
  @Roles(Role.ADMIN, Role.RH)
  @ApiOperation({ summary: 'Publish a new immutable email-template version' })
  createTemplate(@Body() dto: CreateTemplateDto) {
    return this.service.createTemplate(dto);
  }
  @Get('templates')
  @Roles(Role.ADMIN, Role.RH, Role.MANAGER)
  @ApiOperation({ summary: 'List all email-template versions' })
  templates() {
    return this.service.listTemplates();
  }
  @Post()
  @Roles(Role.ADMIN, Role.RH, Role.MANAGER)
  @ApiOperation({
    summary: 'Queue candidate communication without waiting for delivery',
  })
  queue(@Body() dto: QueueCommunicationDto, @Req() req: { user: User }) {
    return this.service.queue(dto, req.user);
  }
  @Get()
  @Roles(Role.ADMIN, Role.RH, Role.MANAGER)
  @ApiOperation({ summary: 'Inspect communication and delivery history' })
  list(@Query() query: CommunicationQueryDto) {
    return this.service.list(query);
  }
  @Post(':id/retry')
  @Roles(Role.ADMIN, Role.RH)
  @ApiOperation({ summary: 'Safely requeue a failed or dead-letter message' })
  retry(@Param('id') id: string) {
    return this.service.retry(id);
  }
  @Get('preferences/:candidateId')
  @Roles(Role.ADMIN, Role.RH, Role.MANAGER, Role.CANDIDATE)
  getPreferences(@Param('candidateId', ParseIntPipe) id: number) {
    return this.service.getPreferences(id);
  }
  @Patch('preferences/:candidateId')
  @Roles(Role.ADMIN, Role.RH, Role.CANDIDATE)
  setPreferences(
    @Param('candidateId', ParseIntPipe) id: number,
    @Body() dto: PreferenceDto,
    @Req() req: { user: User },
  ) {
    return this.service.setPreferences(id, dto, req.user);
  }
}

@ApiTags('Communication webhooks')
@Controller('webhooks/email')
export class CommunicationWebhookController {
  constructor(private service: CommunicationsService) {}
  @Post('status')
  @ApiOperation({
    summary: 'Accept a provider delivery update with an HMAC-SHA256 signature',
  })
  @ApiForbiddenResponse({ description: 'Invalid webhook signature' })
  status(
    @Body() dto: WebhookDto,
    @Headers('x-webhook-signature') signature: string | undefined,
  ) {
    return this.service.webhook(dto, signature, JSON.stringify(dto));
  }
}
