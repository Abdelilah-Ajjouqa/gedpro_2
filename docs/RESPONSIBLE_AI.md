# Responsible AI operations

GEDPro AI features are decision support only. Every AI response contains `advisory: true`; no endpoint changes an application stage, candidate status, scorecard, or hiring outcome.

## Data and ranking policy

- Job matching uses only candidate skills and the job title, description, and department.
- Names, email addresses, phone numbers, age, gender, race, religion, disability, and other protected characteristics are excluded from ranking input.
- Each suggestion exposes its score, matched skills, candidate skills, job terms, and a human-review caveat.
- CV extraction stores the original document link, extracted structure, and any later human correction separately. Corrections never overwrite the original extraction.
- Generation records retain the feature type, local model identifier, prompt version, sanitized input metadata, output, latency, token estimate, cost, requester, and protected-input flag.

The bundled provider is deterministic and local. Its token-overlap similarity is suitable for an auditable baseline, not a claim of model intelligence or hiring fitness. A future provider may replace it only if it preserves the same logging, evidence, correction, and guardrail contracts.

## Human review and monitoring

Recruiters and managers can attach a 1–5 rating, comment, and structured human override to a generation. Administrators can inspect `/ai/monitoring` for usage, latency, ratings, override counts, estimated cost, and protected-input violations.

Input exclusion alone cannot establish fairness. Before production use, owners must periodically compare ranking exposure and hiring outcomes across legally approved demographic cohorts, investigate material disparities, document dataset limitations, and suspend the feature if evidence quality or fairness thresholds fail. Do not infer protected characteristics to create monitoring cohorts; use separately governed, consented data where lawful.

## Retention and incident response

AI records contain recruitment data and must follow the same access, retention, export, and erasure policy as their candidate/application sources. If an unsafe or discriminatory result is reported, preserve the generation ID and human feedback for investigation, disable the affected provider or prompt version, and require manual search while remediation is validated.
