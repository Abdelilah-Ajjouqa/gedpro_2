# Reporting metrics

All report endpoints require an administrator, recruiter (`rh`), or manager token. Administrators and recruiters see all jobs. Managers see only jobs they own. Exports persist the requester's scope and therefore cannot gain broader access while a background job runs.

Date filters use UTC instants with an inclusive `from` and exclusive `to` boundary (`[from,to)`). When omitted, `from` is Unix epoch and `to` is the request time.

- **Funnel count:** distinct applications that entered each stage during the interval. Conversion is the stage count divided by the first ordered stage count.
- **Time to first review:** hours from application creation to its first transition into a category other than `applied`.
- **Time in stage:** hours from entering a stage until the next transition; an active visit ends at report execution time.
- **Time to hire:** days from application creation to its first transition into `hired`.
- **Rejection reasons:** applications currently rejected, grouped by recorded reason.
- **Source effectiveness:** applications and current hires grouped by application source.
- **Recruiter workload:** applications owned by each recruiter in the interval.
- **Interviewer workload:** scheduled interview rows and unsubmitted scorecards in the interval.
- **Job performance:** applications and current hires per job.

`GET /reports/summary?from=...&to=...&jobId=...` returns metrics immediately. `POST /reports/exports` with `format` set to `csv` or `xlsx` queues generation and returns an export ID. Poll `GET /reports/exports/:id`, then download from `/reports/exports/:id/download`. Files expire after `REPORT_EXPORT_TTL_SECONDS` (24 hours by default). Export files contain aggregate data only and intentionally exclude candidate PII.
