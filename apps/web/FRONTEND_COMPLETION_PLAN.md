# GEDPro Frontend Completion Plan

## Purpose

This document is the master roadmap for completing the GEDPro frontend against the existing backend product surface.

It deliberately stays at the level of large product areas. Each phase must be implemented through its own detailed plan in a separate change or conversation. A phase-specific plan should define its exact routes, screens, components, API operations, permissions, states, tests, and delivery slices before implementation starts.

The completed `FRONTEND_PLAN.md` remains the record for the application shell, authentication screens, dashboard, hiring-pipeline overview, theme system, and initial API integration. Those foundations should be reused rather than rebuilt.

## Product objective

Turn the current authenticated dashboard into a complete applicant-tracking frontend that supports the recruitment lifecycle:

1. Configure jobs and hiring pipelines.
2. Create or discover candidates.
3. Open and manage applications.
4. Move applications through valid hiring stages.
5. Schedule interviews and collect structured feedback.
6. Manage recruitment documents and evaluation forms.
7. Communicate with candidates.
8. Make and audit hiring decisions.
9. Review operational reports and export approved data.
10. Administer users, permissions, safeguards, and AI-assisted workflows.

## Current baseline

The frontend already provides:

- A responsive application shell and primary navigation.
- Light, dark, and system themes.
- Login, registration, password-reset, and protected-route flows.
- Access-token refresh handling.
- A query-backed dashboard.
- Dashboard metrics, a pipeline overview, candidate search, upcoming interviews, and recent activity.
- Optimistic application-stage movement from dashboard candidate cards.
- Shared low-level UI primitives and semantic design tokens.

The following navigation targets are currently placeholders because their pages do not exist:

- `/candidates`
- `/jobs`
- `/interviews`
- `/documents`

The backend OpenAPI contract is the source of truth for supported operations:

```text
apps/api/docs/openapi.json
```

## Planning model

### Master plan versus phase plans

This master plan answers:

- Which large product areas remain?
- In what order should they be delivered?
- What business outcome completes each area?
- Which other phases does an area depend on?

A phase-specific implementation plan answers:

- Which routes and screens will be added?
- Which API operations and schemas will be used?
- Which user roles may see and perform each action?
- Which reusable components, hooks, and query keys are required?
- Which loading, empty, error, forbidden, and success states are required?
- How will the phase be divided into reviewable changes?
- How will the completed workflow be verified?

Do not implement an entire phase directly from this master document. First create and approve its focused implementation plan.

### Definition of done for every phase

Every phase-specific plan must require:

- Real backend integration; no permanent mock data.
- Typed request and response boundaries derived from or checked against OpenAPI.
- Role-aware navigation, visibility, and action authorization.
- URL-backed state for shareable search, filters, sorting, tabs, and pagination where appropriate.
- Explicit loading, empty, error, forbidden, conflict, and retry states.
- Confirmation for destructive or privacy-sensitive actions.
- Accessible labels, keyboard support, focus management, and non-color status indicators.
- Responsive behavior for desktop, tablet, and mobile.
- Targeted query invalidation after mutations.
- Unit or component tests for important state and validation logic.
- Integration or end-to-end coverage for the phase's principal workflow.
- Passing lint, strict TypeScript checks, and production build.
- Updated user-facing or developer documentation when behavior changes.

### Cross-cutting rules

- Keep server data in TanStack Query rather than duplicated component state.
- Include authorization scope and all result-changing filters in query keys.
- Treat authorization failures as product states, not generic network errors.
- The UI may hide unauthorized actions for clarity, but the API remains the security boundary.
- Prefer route-level feature ownership over one large global component directory.
- Centralize status labels, tones, and transition rules.
- Preserve server pagination instead of loading unbounded collections.
- Use optimistic updates only where rollback is clear and safe.
- Invalidate the smallest correct set of queries after a mutation.
- Never expose maintenance, webhook, or infrastructure endpoints as ordinary product screens.
- AI output is advisory and must always remain reviewable by a human.

---

# Phase 0 — Frontend platform and contract foundation

## Outcome

Establish the shared architecture needed to implement the remaining product areas consistently and safely.

## Scope

- Decide how OpenAPI types are generated or validated and how contract drift is detected.
- Introduce feature-oriented folders and conventions for API functions, query keys, mutations, forms, and route components.
- Complete session behavior, including logout, current-user loading, expired-session handling, and safe redirects.
- Define the frontend role and capability model for administrator, recruiter, manager, interviewer, and candidate experiences.
- Add shared page scaffolding, breadcrumbs, page headers, tables, pagination, filters, dialogs, form fields, notifications, and confirmation patterns.
- Add standard handling for API validation errors, unauthorized, forbidden, not found, conflict, and unexpected failures.
- Establish test helpers, authenticated fixtures, and an end-to-end test strategy.
- Decide which routes belong in the primary navigation and which belong in contextual or administration navigation.

## Backend areas

- Auth
- Users/profile
- OpenAPI contract and shared error responses

## Completion signal

A new feature can be implemented without inventing its own API, permissions, form, feedback, pagination, or error-handling conventions.

## Dependencies

None. This is the prerequisite for all following phases.

---

# Phase 1 — Jobs and hiring-pipeline administration

## Outcome

Recruiters can create a role, configure its hiring process, publish it, and manage it through its lifecycle.

## Scope

- Jobs list with status, owner, search, filtering, sorting, and pagination.
- Job creation and editing.
- Job detail workspace with recruitment status and related pipeline.
- Publish, close, and archive actions with confirmations and permission checks.
- Pipeline creation and metadata editing.
- Stage creation, editing where supported, deletion, and ordering.
- Allowed stage-transition configuration.
- Clear handling for invalid transitions, conflicting changes, and pipelines already in use.
- Contextual entry points into applications, candidates, interviews, and reporting for a selected job.

## Backend areas

- Jobs
- Pipelines

## Completion signal

An authorized recruiter can create and publish a job with a usable configured pipeline entirely through the frontend.

## Dependencies

- Phase 0

---

# Phase 2 — Candidate directory and candidate profile

## Outcome

Recruiters can find, create, inspect, update, and safely manage candidate records.

## Scope

- Candidate directory with server-side search, filters, sorting, and pagination.
- Candidate creation and editing with backend-aligned validation.
- Candidate profile containing identity, contact data, skills, tags, source, owner, state, applications, documents, and activity entry points.
- Archive and restore workflows.
- Candidate state management.
- Duplicate detection and a guarded merge workflow.
- Candidate privacy export, deletion request, and retention-aware erasure workflows.
- Clear differentiation between deleting/erasing personal information and preserving required recruitment history.
- Deep links from dashboard candidate cards to candidate profiles.

## Backend areas

- Candidates
- Candidate timeline reads where needed
- Candidate privacy operations

## Completion signal

An authorized recruiter can manage a candidate from discovery through archival, duplicate resolution, or a privacy request without using the API directly.

## Dependencies

- Phase 0

---

# Phase 3 — Applications and recruiter pipeline workflow

## Outcome

Recruiters can connect candidates to jobs and manage their complete progression through valid pipeline stages.

## Scope

- Create an application for an existing or newly created candidate.
- Job-scoped and cross-job application lists.
- Application detail workspace.
- Stage movement constrained by configured transitions.
- Reopen workflow for eligible applications.
- Bulk selection and bulk stage movement.
- Rejection, withdrawal, hired, and other terminal-state presentation.
- Immutable application history made visible to the user.
- Conflict handling for duplicate applications and stale stage changes.
- Upgrade the dashboard pipeline so it links to and remains consistent with application detail workflows.

## Backend areas

- Applications
- Pipelines and stages
- Application timeline
- Candidate and job lookups

## Completion signal

A recruiter can create an application and move it from its initial stage to a terminal outcome while the complete history remains inspectable.

## Dependencies

- Phase 1
- Phase 2

---

# Phase 4 — Unified timeline and collaboration notes

## Outcome

Authorized users can understand and document the full history of a candidate or application from one chronological view.

## Scope

- Candidate timeline page or profile section.
- Application timeline page or detail section.
- Visual distinction among system events, user actions, stage changes, interviews, communications, documents, forms, and notes.
- Add candidate-level and application-level notes.
- Permission-aware note composition and visibility.
- Stable deep links to relevant records from timeline events.
- Pagination or progressive loading for long histories.
- Consistent timestamp and actor presentation.

## Backend areas

- Candidate timeline
- Application timeline
- Timeline notes

## Completion signal

A recruiter can explain the complete journey of a candidate or application and add contextual notes without reconstructing history from multiple screens.

## Dependencies

- Phase 2
- Phase 3

---

# Phase 5 — Interviews, scorecards, and hiring decisions

## Outcome

Recruiters and interviewers can schedule interviews, collect structured feedback, and support an auditable hiring decision.

## Scope

- Interview list and calendar-oriented views where useful.
- Interview creation from a candidate or application context.
- Interview detail with participants, schedule, location or meeting details, and related job/application.
- Reschedule and cancel workflows.
- Record interview outcome.
- Scorecard-template creation and discovery.
- Scorecard assignment context and interviewer submission experience.
- Decision summary showing submitted and outstanding feedback.
- Permission-aware views for recruiters, managers, and interviewers.
- Time-zone-safe display and form behavior.
- Upgrade dashboard interview rows to link to operational interview pages.

## Backend areas

- Interviews
- Scorecard templates
- Scorecards
- Application decision summary

## Completion signal

An interview can be scheduled, rescheduled if necessary, evaluated by assigned interviewers, and reviewed in a decision summary entirely through the frontend.

## Dependencies

- Phase 2
- Phase 3
- Phase 4 for the best integrated history experience

---

# Phase 6 — Recruitment document management

## Outcome

Authorized users can securely manage candidate and recruitment documents throughout their lifecycle.

## Scope

- Document library with owner/context filters, metadata, sorting, and pagination.
- Candidate- and application-context document views.
- Multipart upload with progress, validation, cancellation, and retry behavior.
- Authorized preview or temporary URL handling.
- Secure download behavior.
- Document replacement with version/context clarity.
- Archive and permanent-delete workflows with appropriate confirmations.
- File-type, size, unavailable-file, expired-link, and authorization error states.
- Clear treatment of personal data and retention implications.

## Backend areas

- Documents
- Authorized document download and URL operations

## Explicit exclusions

- Retention-maintenance and orphan-cleanup endpoints are operational controls and should not become ordinary user actions. A later admin/operations phase may expose them only if there is a validated requirement.

## Completion signal

An authorized user can upload, inspect, replace, download, archive, and—where permitted—delete a recruitment document without bypassing access controls.

## Dependencies

- Phase 0
- Phase 2
- Phase 3 for application-context documents

---

# Phase 7 — Forms and evaluations

## Outcome

Recruiters can design structured evaluations, assign them, collect responses, and review or export the results.

## Scope

- Forms list with status and applicable filters.
- Form builder for supported dynamic field types and validation rules.
- Draft save, edit, publish, duplicate, archive, and delete workflows.
- Assign a form to an application.
- Candidate or reviewer form-completion experience based on role.
- Submission confirmation and locked/submitted-state behavior.
- Response list and response-detail review.
- Review status or reviewer action workflow.
- Authorized response export.
- Unsaved-change protection and accessible dynamic-form controls.

## Backend areas

- Forms
- Form assignments
- Form submissions and responses
- Response review and export

## Completion signal

A recruiter can publish and assign an evaluation, the intended user can submit it, and an authorized reviewer can inspect and export the response.

## Dependencies

- Phase 0
- Phase 3

---

# Phase 8 — Candidate communications

## Outcome

Recruiters can use reusable templates to send and monitor candidate communications while respecting candidate preferences.

## Scope

- Communication-template list, creation, editing where supported, and preview.
- Compose and send a communication from candidate or application context.
- Communication history with delivery state and failure details.
- Retry workflow for failed communications.
- Candidate communication-preference view and update workflow.
- Clear feedback for queued, sent, delivered, bounced, failed, and retried states supported by the backend.
- Links between communication records and the unified timeline.
- Guardrails against accidental duplicate sends.

## Backend areas

- Communications
- Communication templates
- Candidate communication preferences

## Explicit exclusions

- Provider webhook ingestion is backend infrastructure and must not be represented as a user-facing page.

## Completion signal

An authorized recruiter can send a template-based candidate message, inspect its state, retry a failure, and respect the candidate's communication preferences.

## Dependencies

- Phase 2
- Phase 3
- Phase 4 for integrated history

---

# Phase 9 — Reporting and exports

## Outcome

Recruiters and managers can understand hiring performance and obtain authorized, asynchronous report exports.

## Scope

- Reporting overview with date and job filters.
- Funnel, conversion, velocity, rejection, source, workload, and job-oriented views supported by the summary response.
- Role-scoped presentation so managers see only authorized jobs and aggregates.
- Accessible tabular alternatives for charts.
- Export request flow for CSV and XLSX.
- Export history with pending, processing, completed, failed, and expired states.
- Polling or refresh behavior for in-progress exports.
- Authorized download and expiry handling.
- Clear definition of time boundaries and filter scope in the UI.

## Backend areas

- Report summary
- Report export creation, listing, status, and download

## Completion signal

An authorized user can inspect meaningful hiring metrics, request a scoped export, monitor its generation, and download it when complete.

## Dependencies

- Phase 1
- Phase 3
- Reliable application-stage data

---

# Phase 10 — User and access administration

## Outcome

Administrators can manage internal users and role assignments through a safe, auditable interface.

## Scope

- User directory.
- User creation with an assigned role.
- User detail and editing.
- User deletion or deactivation behavior according to the backend contract and product rules.
- Current-profile presentation and account actions.
- Role and capability explanations in the UI.
- Safeguards against removing required administrative access or performing unintended privileged changes.
- Administration navigation visible only to appropriate users.

## Backend areas

- Users
- Current-user profile
- Auth logout and session lifecycle where still outstanding

## Completion signal

An administrator can manage the supported user lifecycle and role assignments without direct API access, while non-administrators cannot access administration surfaces.

## Dependencies

- Phase 0

---

# Phase 11 — Responsible AI assistance and oversight

## Outcome

Authorized users can use AI-assisted recruitment tools as transparent decision support, with human review and operational oversight.

## Scope

- CV extraction request and human correction workflow.
- Natural-language candidate search.
- Job-to-candidate matching with evidence and limitations.
- Interview-question suggestions that remain editable drafts.
- Application summary generation.
- Feedback capture for AI generations, including ratings, comments, and human overrides.
- Administrator monitoring view for usage, quality, latency, cost, and guardrail signals supported by the API.
- Prominent advisory labeling and explanation of excluded protected inputs.
- No automatic stage changes, hiring decisions, or score submissions from AI output.
- Failure, timeout, unavailable-provider, and partial-result states.

## Backend areas

- Responsible AI endpoints
- AI generation feedback
- AI monitoring

## Completion signal

AI features provide reviewable assistance with visible evidence and human control, and administrators can inspect their operational and guardrail status.

## Dependencies

- Phase 2
- Phase 3
- Phase 5 for interview-question integration
- Phase 6 for document-based extraction
- Stable permissions and audit behavior

---

# Phase 12 — Product-wide integration and release readiness

## Outcome

The individual product areas operate as one coherent, production-ready recruitment application.

## Scope

- Complete navigation, breadcrumbs, contextual links, and back-navigation across all implemented routes.
- Global search or command navigation only if justified by validated workflows.
- Consistent terminology and statuses across dashboard, lists, profiles, timelines, and reports.
- Role-based end-to-end journeys for administrator, recruiter, manager, interviewer, and candidate users.
- Cross-feature cache invalidation and stale-data review.
- Browser refresh, direct-link, expired-session, and multi-tab behavior.
- Empty-tenant and first-use onboarding states.
- Accessibility audit and keyboard-only workflow verification.
- Responsive verification at agreed viewport sizes.
- Performance review for route bundles, tables, images, forms, and large datasets.
- Security-focused frontend review for tokens, redirects, downloads, sensitive fields, and accidental data exposure.
- Production error monitoring and actionable failure messages.
- Final removal of dead placeholders and unsupported navigation.

## End-to-end acceptance journey

At minimum, release verification must demonstrate:

1. An administrator provisions an authorized recruiter.
2. The recruiter creates a pipeline and publishes a job.
3. The recruiter creates or reuses a candidate.
4. The recruiter opens an application for that job.
5. The application moves through allowed stages with visible history.
6. The recruiter uploads relevant documents and assigns an evaluation if needed.
7. The recruiter schedules an interview and interviewers submit feedback.
8. The recruiter reviews the decision summary and records the final outcome.
9. Communications and significant events appear in the appropriate history.
10. An authorized manager reviews scoped reporting and downloads an export.

## Completion signal

The complete recruitment journey works across roles and feature boundaries with no required direct API calls, dead navigation targets, or critical accessibility, security, or responsive defects.

## Dependencies

- All product phases selected for the target release

---

# Recommended delivery sequence

## Release A — Core applicant-tracking workflow

1. Phase 0 — Frontend platform and contract foundation
2. Phase 1 — Jobs and hiring-pipeline administration
3. Phase 2 — Candidate directory and candidate profile
4. Phase 3 — Applications and recruiter pipeline workflow
5. Phase 4 — Unified timeline and collaboration notes
6. Phase 5 — Interviews, scorecards, and hiring decisions

This release establishes the smallest coherent operational ATS.

## Release B — Recruitment operations

7. Phase 6 — Recruitment document management
8. Phase 7 — Forms and evaluations
9. Phase 8 — Candidate communications

This release adds the supporting tools used during active recruitment.

## Release C — Governance and insight

10. Phase 9 — Reporting and exports
11. Phase 10 — User and access administration

This release adds management visibility and administration.

## Release D — Assisted workflows and hardening

12. Phase 11 — Responsible AI assistance and oversight
13. Phase 12 — Product-wide integration and release readiness

AI should follow stable core workflows, permissions, data quality, and auditability.

Some independent work may overlap after Phase 0, but dependencies above should determine when a workflow can be considered complete.

---

# Phase-plan template

Create a separate plan before implementing any phase. Use the following structure:

```text
# <Phase name> implementation plan

## Objective
## User roles and permissions
## User journeys
## Routes and navigation
## Backend operations and schemas
## Data model and frontend types
## Query keys and cache policy
## Mutations and invalidation
## Screens and component boundaries
## Forms and validation
## Loading, empty, error, forbidden, and conflict states
## Responsive and accessibility requirements
## Security and privacy considerations
## Delivery slices
## Test strategy
## Verification commands
## Acceptance criteria
## Explicit exclusions
## Open decisions
```

Each delivery slice in a phase plan should be independently reviewable, keep the application buildable, and complete a visible portion of the user journey.

## Suggested prompt for a phase-planning change

```text
Create a detailed implementation plan for Phase <number> from
apps/web/FRONTEND_COMPLETION_PLAN.md.

Inspect the current frontend, the relevant backend controllers and DTOs, and
apps/api/docs/openapi.json. Do not implement the feature yet. Write a focused
plan covering routes, roles, API contracts, UI states, component boundaries,
query and mutation behavior, delivery slices, tests, and acceptance criteria.
Record unresolved product decisions explicitly instead of guessing them.
```

## Progress tracking

| Phase | Area | Status | Phase-specific plan | Notes |
|---:|---|---|---|---|
| 0 | Frontend platform and contract foundation | In progress | `plans/PHASE_0_PLAN.md` | BFF, contracts, session, capabilities, shared UI, and tests implemented; manager-scope audit remains |
| 1 | Jobs and hiring-pipeline administration | Planned | `plans/PHASE_1_PLAN.md` | Core ATS release |
| 2 | Candidate directory and candidate profile | Planned | `plans/PHASE_2_PLAN.md` | Core ATS release |
| 3 | Applications and recruiter pipeline workflow | Planned | `plans/PHASE_3_PLAN.md` | Core ATS release |
| 4 | Unified timeline and collaboration notes | Planned | `plans/PHASE_4_PLAN.md` | Core ATS release |
| 5 | Interviews, scorecards, and hiring decisions | Planned | `plans/PHASE_5_PLAN.md` | Core ATS release |
| 6 | Recruitment document management | Not started | — | Recruitment operations release |
| 7 | Forms and evaluations | Not started | — | Recruitment operations release |
| 8 | Candidate communications | Not started | — | Recruitment operations release |
| 9 | Reporting and exports | Not started | — | Governance and insight release |
| 10 | User and access administration | Not started | — | Governance and insight release |
| 11 | Responsible AI assistance and oversight | Not started | — | Begins after core workflows stabilize |
| 12 | Product-wide integration and release readiness | Not started | — | Final cross-product verification |

Allowed statuses are `Not started`, `Planning`, `Planned`, `In progress`, `Blocked`, and `Complete`.

Completing a phase requires both its implementation acceptance criteria and its verification evidence. Creating a plan alone changes its status only to `Planned`.
