import { FormWorkspace } from '@/features/forms/form-workspace';
export default async function Page({ params }: { params: Promise<{ formId: string }> }) { const { formId } = await params; return <FormWorkspace id={formId} />; }
