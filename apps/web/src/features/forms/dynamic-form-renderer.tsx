'use client';
import { useEffect } from 'react';
import type { FormField } from './types';

export function isFieldActive(field: FormField, answers: Record<string, unknown>) {
  if (!field.condition) return true;
  const equal = answers[field.condition.fieldId] === field.condition.value;
  return field.condition.operator === 'equals' ? equal : !equal;
}
export function DynamicFormRenderer({ fields, answers, onChange, readonly = false }: { fields: FormField[]; answers: Record<string, unknown>; onChange?: (id: string, value: unknown) => void; readonly?: boolean }) {
  useEffect(() => { fields.filter((field) => !isFieldActive(field, answers) && answers[field.id] !== undefined).forEach((field) => onChange?.(field.id, undefined)); }, [answers, fields, onChange]);
  return <fieldset className="grid gap-4"><legend className="sr-only">Form fields</legend>{fields.map((field) => {
    if (!isFieldActive(field, answers)) return null;
    const value = answers[field.id]; const id = `form-field-${field.id}`;
    if (readonly) return <div key={field.id} className="rounded-md border p-3"><dt className="text-sm font-medium">{field.label}</dt><dd className="mt-1 text-sm text-muted-foreground">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value === undefined || value === '' ? 'No answer' : String(value)}</dd></div>;
    const common = { id, required: field.required, value: typeof value === 'string' || typeof value === 'number' ? value : '', onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange?.(field.id, field.type === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value), className: 'h-10 rounded-md border bg-background px-3' };
    return <div key={field.id} className="grid gap-1"><label htmlFor={id} className="text-sm font-medium">{field.label}{field.required ? <span aria-hidden="true"> *</span> : null}</label>{field.type === 'select' ? <select {...common}><option value="">Choose an option</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select> : field.type === 'boolean' ? <label className="flex items-center gap-2 text-sm"><input id={id} type="checkbox" checked={value === true} required={field.required} onChange={(e) => onChange?.(field.id, e.target.checked)} /> Yes</label> : field.type === 'file' ? <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">Choose an existing authorized document from the Documents workspace. File answers require the document selector contract.</p> : <input {...common} type={field.type === 'text' ? 'text' : field.type} />}</div>;
  })}</fieldset>;
}
