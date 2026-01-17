import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';
import { Form, FormSchema } from './schemas/form.schema';
import { FormResponse, FormResponseSchema } from './schemas/form-response.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Form.name, schema: FormSchema },
      { name: FormResponse.name, schema: FormResponseSchema },
    ]),
  ],
  providers: [FormsService],
  controllers: [FormsController]
})
export class FormsModule { }
