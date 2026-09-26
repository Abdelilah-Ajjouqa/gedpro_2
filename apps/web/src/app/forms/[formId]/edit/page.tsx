import { FormEditPage } from '@/features/forms/form-edit-page';
export default async function Page({ params }: { params: Promise<{ formId: string }> }) { const { formId } = await params; return <FormEditPage id={formId} />; }
