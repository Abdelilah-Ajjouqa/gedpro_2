export type FormFieldType = 'text' | 'number' | 'date' | 'file' | 'select' | 'email' | 'boolean';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export type FormCondition = { fieldId: string; operator: 'equals' | 'not_equals'; value: string };
export type FormField = { id: string; label: string; type: FormFieldType; required: boolean; options?: string[]; condition?: FormCondition };
export type FormVersion = { version: number; title: string; description?: string; fields: FormField[]; status: 'draft' | 'published'; createdAt: string; publishedAt?: string };
export type Form = { _id: string; title: string; description?: string; status: 'draft' | 'published' | 'archived'; currentVersion: number; versions: FormVersion[]; createdAt: string; updatedAt: string; archivedAt?: string };
export type FormAssignment = { _id: string; formId: string; jobId?: number; applicationId?: number; stageId?: number; createdAt: string };
export type FormResponse = { _id: string; formId: string; formVersion: number; formTitle: string; fieldsSnapshot: FormField[]; answers: Record<string, unknown>; candidateId?: number; applicationId?: number; reviewStatus: ReviewStatus; reviewNotes?: string; reviewedAt?: string; createdAt: string };
export type FormResponseFilters = { candidateId?: number; applicationId?: number; reviewStatus?: ReviewStatus; page: number; limit: number };
export type FormResponsePage = { data: FormResponse[]; total: number; page: number; limit: number };
export type FormInput = { title: string; description?: string; fields: FormField[] };
