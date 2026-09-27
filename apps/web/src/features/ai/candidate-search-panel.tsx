'use client';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { AiAdvisoryBanner } from './advisory';
import { searchCandidates } from './api';
import { useAuth } from '@/components/providers/auth-provider';

export function AiCandidateSearchPanel() {
  const { hasCapability } = useAuth();
  const [query, setQuery] = useState('');
  const search = useMutation({
    mutationFn: () => searchCandidates(query.trim(), 20),
  });
  if (!hasCapability('ai:candidate-search')) return null;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (query.trim().length) search.mutate();
  };
  return (
    <section
      className="mb-5 space-y-3 rounded-xl border bg-card p-4"
      aria-labelledby="ai-search-heading"
    >
      <div>
        <h2 id="ai-search-heading" className="font-semibold">
          AI-assisted candidate discovery
        </h2>
        <p className="text-sm text-muted-foreground">
          Search relevance uses skills and recruiter-applied tags only; it is
          not a suitability assessment.
        </p>
      </div>
      <AiAdvisoryBanner />
      <form className="flex flex-wrap gap-2" onSubmit={submit}>
        <label className="grid min-w-56 flex-1 gap-1 text-sm">
          <span>Professional skills or tags</span>
          <input
            className="h-10 rounded-md border bg-background px-3"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={500}
            required
          />
        </label>
        <Button className="self-end" type="submit" disabled={search.isPending}>
          {search.isPending ? 'Searching…' : 'Find candidates'}
        </Button>
      </form>
      {search.isError ? (
        <p className="text-sm text-destructive" role="alert">
          {search.error instanceof ApiError
            ? search.error.message
            : 'Candidate discovery is unavailable.'}
        </p>
      ) : null}
      {search.data ? (
        <div aria-live="polite" className="space-y-2">
          <p className="text-sm">
            {search.data.results.length} advisory result(s). Review the listed
            evidence before taking any separate action.
          </p>
          {search.data.results.map((result) => (
            <article className="rounded-md border p-3" key={result.candidateId}>
              <Link
                className="font-medium hover:underline"
                href={`/candidates/${result.candidateId}`}
              >
                {result.name}
              </Link>
              <p className="text-sm">Search relevance: {result.score}%</p>
              <p className="text-sm text-muted-foreground">
                Matched terms:{' '}
                {result.evidence.matchedTerms.join(', ') || 'None'} · Skills:{' '}
                {result.evidence.skills.join(', ') || 'None'} · Tags:{' '}
                {result.evidence.tags.join(', ') || 'None'}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
