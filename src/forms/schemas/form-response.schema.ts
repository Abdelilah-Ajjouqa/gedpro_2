import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type FormResponseDocument = HydratedDocument<FormResponse>;

@Schema({ timestamps: true })
export class FormResponse {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Form', required: true })
    formId: string;

    @Prop({ type: MongooseSchema.Types.Mixed, required: true })
    answers: Record<string, any>; // Key: Field Label/ID, Value: User Answer

    @Prop()
    candidateId?: number; // Optional link to Postgres Candidate ID

    @Prop()
    submittedBy?: number; // Optional link to Postgres User ID (if internal)
}

export const FormResponseSchema = SchemaFactory.createForClass(FormResponse);
