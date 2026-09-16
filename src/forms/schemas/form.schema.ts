import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
export type FormDocument = HydratedDocument<Form>;
@Schema({ _id: false })
export class FormCondition {
  @Prop({ required: true }) fieldId: string;
  @Prop({ required: true, enum: ['equals', 'not_equals'] }) operator: string;
  @Prop({ required: true, type: Object }) value: unknown;
}
const FormConditionSchema = SchemaFactory.createForClass(FormCondition);
@Schema({ _id: false })
export class FormField {
  @Prop({ required: true }) id: string;
  @Prop({ required: true }) label: string;
  @Prop({
    required: true,
    enum: ['text', 'number', 'date', 'file', 'select', 'email', 'boolean'],
  })
  type: string;
  @Prop({ default: false }) required: boolean;
  @Prop([String]) options?: string[];
  @Prop({ type: FormConditionSchema }) condition?: FormCondition;
}
export const FormFieldSchema = SchemaFactory.createForClass(FormField);
@Schema({ _id: false })
export class FormVersion {
  @Prop({ required: true }) version: number;
  @Prop({ required: true }) title: string;
  @Prop() description?: string;
  @Prop({ type: [FormFieldSchema], default: [] }) fields: FormField[];
  @Prop({ required: true, enum: ['draft', 'published'] }) status: string;
  @Prop() publishedAt?: Date;
  @Prop({ required: true }) createdAt: Date;
}
const FormVersionSchema = SchemaFactory.createForClass(FormVersion);
@Schema({ timestamps: true })
export class Form {
  @Prop({ required: true }) title: string;
  @Prop() description?: string;
  @Prop({ type: [FormVersionSchema], required: true }) versions: FormVersion[];
  @Prop({ required: true, default: 1 }) currentVersion: number;
  @Prop({
    required: true,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  })
  status: string;
  @Prop() archivedAt?: Date;
  @Prop({ required: true }) createdBy: number;
}
export const FormSchema = SchemaFactory.createForClass(Form);
FormSchema.index({ status: 1, updatedAt: -1 });
