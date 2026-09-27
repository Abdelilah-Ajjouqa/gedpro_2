'use client';
import { useMutation } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AiAdvisoryBanner } from './advisory';
import { correctExtraction, extractCv } from './api';

export function CvExtractionPanel({ candidateId }: { candidateId: number }) {
  const [text, setText] = useState('');
  const [notice, setNotice] = useState('');
  const extract = useMutation({
    mutationFn: () => extractCv(candidateId, text),
    onSuccess: () => {
      setText('');
      setNotice(
        'Extraction is ready for review; nothing was changed on the candidate.',
      );
    },
  });
  const correct = useMutation({
    mutationFn: () =>
      correctExtraction(extract.data!.id, extract.data!.effective),
    onSuccess: () =>
      setNotice(
        'Human correction evidence saved. Candidate data remains unchanged.',
      ),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (text.trim()) extract.mutate();
  };
  return (
    <section
      className="mt-6 space-y-3 rounded-xl border bg-card p-4"
      aria-labelledby="cv-ai-heading"
    >
      <h2 id="cv-ai-heading" className="font-semibold">
        CV extraction review
      </h2>
      <AiAdvisoryBanner />
      <p className="text-sm text-muted-foreground">
        Paste only text you have reviewed and are authorized to use. The source
        file is not read or altered.
      </p>
      <form className="space-y-2" onSubmit={submit}>
        <label className="grid gap-1 text-sm">
          <span>Reviewed CV text</span>
          <textarea
            className="min-h-32 rounded-md border bg-background p-3"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={100000}
            required
          />
        </label>
        <Button type="submit" disabled={extract.isPending}>
          {extract.isPending ? 'Extracting…' : 'Generate extraction'}
        </Button>
      </form>
      {extract.isError ? (
        <p role="alert" className="text-sm text-destructive">
          Extraction could not be completed.
        </p>
      ) : null}
      {extract.data ? (
        <div className="space-y-2 rounded-md border p-3">
          <h3 className="font-medium">Review extracted values</h3>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs">
            {JSON.stringify(extract.data.effective, null, 2)}
          </pre>
          <Button
            variant="outline"
            onClick={() => correct.mutate()}
            disabled={correct.isPending}
          >
            Record reviewed correction
          </Button>
        </div>
      ) : null}
      {notice ? (
        <p className="text-sm" aria-live="polite">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
