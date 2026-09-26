import { FormResponsesPage } from '@/features/forms/form-responses-page';
export default async function Page({ params }: { params: Promise<{ formId: string }> }) { const { formId } = await params; return <FormResponsesPage formId={formId} />; }
