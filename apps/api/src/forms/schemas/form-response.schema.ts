import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { FormField, FormFieldSchema } from './form.schema';
export type FormResponseDocument = HydratedDocument<FormResponse>;
@Schema({ timestamps: true })
export class FormResponse {
  @Prop({ required: true, index: true }) formId: string;
  @Prop({ required: true }) formVersion: number;
  @Prop({ required: true }) formTitle: string;
  @Prop({ type: [FormFieldSchema], required: true })
  fieldsSnapshot: FormField[];
  @Prop({ type: Object, required: true }) answers: Record<string, unknown>;
  @Prop({ index: true }) candidateId?: number;
  @Prop({ index: true }) applicationId?: number;
  @Prop() jobId?: number;
  @Prop() stageId?: number;
  @Prop() submittedBy?: number;
  @Prop({
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  })
  reviewStatus: string;
  @Prop() reviewedBy?: number;
  @Prop() reviewedAt?: Date;
  @Prop() reviewNotes?: string;
}
export const FormResponseSchema = SchemaFactory.createForClass(FormResponse);
FormResponseSchema.index({ formId: 1, createdAt: -1 });
@Schema({ timestamps: true })
export class FormAssignment {
  @Prop({ required: true, index: true }) formId: string;
  @Prop() jobId?: number;
  @Prop() applicationId?: number;
  @Prop({ index: true }) stageId?: number;
  @Prop({ required: true }) createdBy: number;
}
export type FormAssignmentDocument = HydratedDocument<FormAssignment>;
export const FormAssignmentSchema =
  SchemaFactory.createForClass(FormAssignment);
FormAssignmentSchema.index(
  { formId: 1, jobId: 1, applicationId: 1, stageId: 1 },
  { unique: true },
);
