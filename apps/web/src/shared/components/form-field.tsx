import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function FormField({
  label,
  description,
  error,
  required,
  input,
  children,
}: {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  input?: InputHTMLAttributes<HTMLInputElement>;
  children?: ReactNode;
}) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {description ? (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
      {children ?? (
        <input
          {...input}
          id={id}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={
            [description ? descriptionId : '', error ? errorId : '']
              .filter(Boolean)
              .join(' ') || undefined
          }
          className={cn(
            'h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
            input?.className,
          )}
        />
      )}
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormErrorSummary({
  errors,
}: {
  errors: { fieldId?: string; message: string }[];
}) {
  if (!errors.length) return null;
  return (
    <section
      className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
      role="alert"
      tabIndex={-1}
    >
      <p className="font-medium">Please correct the following:</p>
      <ul className="mt-1 list-disc pl-5">
        {errors.map((error, index) => (
          <li key={`${error.fieldId ?? 'form'}-${index}`}>
            {error.fieldId ? (
              <a className="underline" href={`#${error.fieldId}`}>
                {error.message}
              </a>
            ) : (
              error.message
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
