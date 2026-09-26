import { FormCompletionPage } from '@/features/forms/form-completion-page';
export default async function Page({ params }: { params: Promise<{ applicationId: string; formId: string }> }) { const { applicationId, formId } = await params; return <FormCompletionPage applicationId={Number(applicationId)} formId={formId} />; }
