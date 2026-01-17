import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FormDocument = HydratedDocument<Form>;

@Schema()
export class FormField {
    @Prop({ required: true })
    label: string;

    @Prop({ required: true, enum: ['text', 'number', 'date', 'file', 'select', 'email'] })
    type: string;

    @Prop({ default: false })
    required: boolean;

    @Prop([String])
    options?: string[]; // For 'select' type
}

const FormFieldSchema = SchemaFactory.createForClass(FormField);

@Schema({ timestamps: true })
export class Form {
    @Prop({ required: true })
    title: string;

    @Prop()
    description: string;

    @Prop({ type: [FormFieldSchema], default: [] })
    fields: FormField[];

    @Prop({ required: true })
    createdBy: number; // Links to Postgres User ID
}

export const FormSchema = SchemaFactory.createForClass(Form);
