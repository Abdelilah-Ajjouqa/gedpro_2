# GEDPro Frontend Delivery Plan

## Project objective

Build the approved GEDPro recruitment dashboard in `apps/web` using Next.js, TypeScript, Tailwind CSS, and shadcn/ui. The supplied light and dark references are the visual source of truth: monochrome surfaces, thin borders, rounded connected elements, compact typography, and restrained status colors.

The existing npm-workspaces repository, App Router structure, backend application, scripts, and deployment configuration must remain intact.

## Surface and layout direction

- The primary application shell uses the full viewport width and height.
- Main application content is not presented as a floating card or inset desktop frame.
- Borders and surface changes may separate persistent regions such as the global header from page content.
- Floating elevation, prominent rounding, backdrop treatments, and overlay shadows are reserved for temporary or focused surfaces such as forms, dialogs, popovers, menus, sheets, and notifications.

## Agreed architecture

- Next.js App Router with Server Components by default
- TypeScript strict mode
- Tailwind CSS with semantic CSS variables
- shadcn/ui for accessible primitives
- Lucide icons
- `next-themes` for light, dark, and system themes
- Typed mock data until the backend contract is finalized
- TanStack Query when API-backed reads and mutations begin
- React Hook Form and Zod when forms are introduced
- No Redux Toolkit or Zustand initially

## State ownership

| State | Owner |
|---|---|
| Candidates, pipelines, metrics, interviews, and activity | TanStack Query after API integration |
| Search, filters, sorting, selected stage, and pagination | URL search parameters |
| Open menus, dialogs, tabs, and expanded cards | Local React state |
| Form values and validation | React Hook Form and Zod |
| Light, dark, and system theme | `next-themes` |
| Complex shared client-only workflows | Zustand only when justified by a concrete requirement |

Components must not keep local copies of server-owned data. Candidate status comes from the candidate record and is rendered through centralized status configuration.

---

# Phase 1 — Frontend foundation

## Goal

Establish the styling, component, theme, and folder foundations without implementing the complete dashboard.

## Work

- Install and configure Tailwind CSS in `apps/web`.
- Initialize shadcn/ui while preserving existing project configuration.
- Add Lucide icons and `next-themes`.
- Create the shared utility and UI primitive directories.
- Add the root theme provider.
- Define semantic CSS variables for surfaces, text, borders, focus rings, statuses, shadows, and radii.
- Establish typography, focus states, resets, and reduced-motion behavior.
- Create the component, data, configuration, and type directories.

## Performance decisions

- Do not introduce TanStack Query during this phase.
- Keep the root layout server-rendered.
- Make only the theme provider a client boundary.
- Avoid remote font downloads at build time.

## Verification

- ESLint passes with zero warnings.
- Production build passes.
- Light, dark, and system themes apply without hydration errors.
- Semantic variables work consistently in both themes.

## Completion criteria

- The frontend toolchain is ready for feature components.
- No backend code or unrelated repository configuration is changed.
- The starter route still loads successfully.

---

# Phase 2 — Application shell and navigation

## Goal

Create the responsive, full-viewport GEDPro shell and global navigation shown in the references.

## Components

```text
AppShell
└── AppHeader
    ├── Brand
    ├── PrimaryNav
    ├── SearchAction
    ├── ThemeToggle
    └── UserMenu
```

## Work

- Build an edge-to-edge application shell that uses the full viewport.
- Add the GEDPro wordmark and tagline.
- Add navigation for Dashboard, Candidates, Jobs, Interviews, and Documents.
- Add search, theme, and profile controls.
- Use shadcn/ui buttons, menus, tooltips, and sheets.
- Add active navigation styling through semantic tokens.
- Add a compact mobile header and sheet navigation.
- Keep the application shell edge-to-edge at every viewport width.
- Reserve floating card treatment and elevation for forms, popups, menus, sheets, and notifications.

## State

- Theme state: `next-themes`.
- Open menus and mobile sheet: local primitive state.
- Active route: derived from the pathname when multiple routes exist.

## Responsive behavior

- Desktop: complete navigation and full-width shell.
- Tablet: condensed controls and hidden secondary navigation where necessary.
- Mobile: compact header with sheet navigation.

## Verification

- Navigate entirely by keyboard.
- Verify accessible names for icon-only buttons.
- Test the mobile sheet and profile menu.
- Verify theme switching.
- Check desktop, tablet, and mobile viewport widths.

## Completion criteria

- The shell uses the complete viewport without an inset frame or unused outer gutter.
- Floating elevation remains reserved for focused and temporary interface surfaces.
- Navigation remains usable without layout shifts.

---

# Phase 3 — Dashboard summary and metrics

## Goal

Build the manager greeting and dashboard metrics as reusable, data-driven components.

## Components

```text
DashboardSummary
├── ManagerCard
└── MetricCard[]
```

## Work

- Define TypeScript models for people and metrics.
- Create typed mock metric fixtures.
- Build the manager greeting card.
- Build the reusable metric card.
- Add candidates, open jobs, interviews, and new-today metrics.
- Match the reference hierarchy, icon containers, spacing, and density.
- Use initials when an avatar is unavailable.

## Data boundary

The page retrieves data through a replaceable function such as `getDashboardData()`. It initially returns fixtures and can later call the API without changing visual components.

## Performance decisions

- Render metrics and the manager card as Server Components.
- Do not hydrate static cards.
- Reserve avatar dimensions to prevent layout shifts.

## Verification

- Test long names and large metric values.
- Test missing avatar behavior.
- Verify responsive metric layouts.
- Check contrast in both themes.

## Completion criteria

- Summary components are typed, reusable, and separate from mock data.
- The top section matches the reference composition.

---

# Phase 4 — Hiring pipeline and candidate cards

## Goal

Implement the central five-stage pipeline with reusable candidate and status components.

## Components

```text
HiringPipeline
└── PipelineStage[]
    ├── StageHeader
    ├── CandidateCard[]
    └── PipelineConnector
```

## Work

- Define candidate, stage, and status types.
- Create typed pipeline mock data.
- Build New, Reviewing, Interview, Offer, and Hired stage headers.
- Build candidate cards with avatar, name, role, rating, date, status, and actions.
- Build custom connectors matching the reference.
- Add the Add Candidate action.
- Preserve readable card widths responsively.

## Status system

Use typed values:

```ts
type CandidateStatus =
  | 'new'
  | 'reviewing'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected';
```

Central configuration maps each status to its label, semantic tone, and optional icon. Supported tones are `neutral`, `warning`, `success`, and `danger`. Components must not contain scattered status checks or hard-coded status colors.

## Responsive behavior

- Wide desktop: five connected columns.
- Tablet: horizontally scrollable pipeline with preserved card widths.
- Mobile: vertical stages or a controlled horizontal viewport, selected after visual testing.

## Performance decisions

- Keep the mock pipeline server-rendered.
- Avoid JavaScript-based layout calculations.
- Use CSS Grid and Flexbox for geometry.
- Add pagination or virtualization only when real candidate counts require it.

## Verification

- Verify horizontal scrolling and keyboard access.
- Check connector alignment.
- Test long names and roles.
- Confirm status does not rely on color alone.
- Verify accessible labels for candidate actions.

## Completion criteria

- All five stages render from mock data.
- Candidate cards are reusable and status presentation is centralized.
- The pipeline remains usable at all target widths.

---

# Phase 5 — Interviews and recent activity

## Goal

Complete the initial dashboard with the two supporting panels shown in the references.

## Components

```text
DashboardPanels
├── UpcomingInterviews
│   └── InterviewRow[]
└── RecentActivity
    └── ActivityItem[]
```

## Work

- Define interview and activity event types.
- Create typed mock fixtures.
- Build a shared panel header.
- Build interview rows with identity, role, schedule, meeting action, and menu.
- Build activity items with icon, description, timestamp, and status indicator.
- Place panels side by side on wide screens and stack them on smaller screens.

## Performance decisions

- Render fixtures on the server.
- Keep row interactions as small client islands only when needed.
- Avoid unnecessary animation libraries.

## Verification

- Test long descriptions and narrow timestamps.
- Test keyboard access to row actions.
- Confirm timeline colors and labels in both themes.

## Completion criteria

- Both panels closely match the references.
- Their data and presentation remain separate.

---

# Phase 6 — Avatar integration and visual refinement

## Goal

Integrate approved assets and perform the detailed visual-fidelity pass.

## Avatar source

Approved avatars belong in:

```text
apps/web/public/assets/avatars/
```

Mock data references `/assets/avatars/<filename>`. Missing images fall back to initials.

## Work

- Map portraits to managers and candidates.
- Use optimized images with explicit dimensions.
- Preserve initials as image-error fallbacks.
- Tune shell proportions, typography, spacing, borders, radii, icons, and shadows.
- Refine light and dark surfaces independently.
- Check connected pipeline geometry.
- Add subtle hover, focus, and pressed states.

## Asset recommendations

- Square portraits
- At least 256 by 256 pixels
- Consistent crop and lighting
- WebP or AVIF preferred; PNG and JPEG supported

## Performance decisions

- Set explicit avatar dimensions.
- Do not preload every candidate image.
- Prioritize only images affecting the initial visible content.

## Verification

- Compare full-page screenshots with both references.
- Verify images cause no layout shift.
- Check light and dark modes independently.
- Verify focus, hover, active, and disabled states.

## Completion criteria

- Visible drift from the references has been reduced through screenshot comparison.
- Portraits load cleanly and fall back safely.

---

# Phase 7 — API integration and caching

## Goal

Replace mock data with backend data while preserving the component APIs.

## Work

- Install and configure TanStack Query.
- Add its provider at the narrowest practical client boundary.
- Create API functions for metrics, pipeline, candidates, interviews, and activity.
- Replace fixtures incrementally through the data-access layer.
- Add loading skeletons, empty states, and error states.
- Store shareable filters, sorting, and pagination in URL parameters.
- Add candidate-stage and dashboard mutations.

## Query keys

```text
['dashboard-metrics', filters]
['pipeline', jobId, filters]
['candidate', candidateId]
['upcoming-interviews', filters]
['recent-activity', filters]
```

## Initial cache policy

| Data | Stale time | Unused cache retention |
|---|---:|---:|
| Hiring pipeline | 10–30 seconds | 5 minutes |
| Dashboard metrics | 30–60 seconds | 5 minutes |
| Upcoming interviews | 30–60 seconds | 5 minutes |
| Recent activity | 15–30 seconds | 5 minutes |
| Candidate details | 1–2 minutes | 10 minutes |
| Static reference data | 10–30 minutes | 30 minutes |

## Mutation behavior

1. Save the previous cached pipeline.
2. Update the visible pipeline optimistically.
3. Send the mutation to the API.
4. Keep the update on success.
5. Roll back on failure.
6. Revalidate affected pipeline, metrics, and candidate keys.

## Cache safety

- Never globally cache permission-sensitive recruiter data.
- Include tenant, authorization, and filter dimensions in server cache keys.
- Avoid competing caches for the same rapidly changing response.
- Introduce Redis only after measurements identify expensive shared backend queries.

## Verification

- Test loading, empty, success, and failure states.
- Test optimistic updates and rollback.
- Verify targeted invalidation avoids unrelated refetches.
- Confirm tenant data cannot leak across cache keys.
- Check request cancellation during rapid filter changes.

## Completion criteria

- API data replaces fixtures without redesigning components.
- Mutations feel immediate and recover safely.
- Cache behavior is documented and observable.

---

# Phase 8 — Final quality and release verification

## Goal

Validate correctness, accessibility, responsiveness, performance, and production readiness.

## Quality checks

- Run ESLint with zero warnings.
- Run the production build and strict TypeScript checks.
- Check browser and server consoles.
- Verify there are no hydration errors.
- Verify light, dark, and system themes.
- Verify desktop, tablet, and mobile layouts.
- Test keyboard navigation and focus order.
- Confirm status is understandable without color.
- Test reduced-motion behavior.
- Check long content, missing avatars, empty lists, and API errors.

## Performance checks

- Confirm static layout remains server-rendered.
- Review client component boundaries and initial JavaScript size.
- Check image sizing and layout stability.
- Ensure secondary workflows load only when required.
- Test large candidate collections before introducing virtualization.

## Definition of done

- The dashboard closely matches both approved references.
- Light, dark, and system themes work correctly.
- Desktop, tablet, and mobile layouts remain usable.
- Major sections are reusable, focused components.
- Data and presentation are separated and typed.
- Status presentation is centrally configured.
- Client-side JavaScript is limited to actual interactions.
- Avatar files can change without component edits.
- Accessibility and responsive checks pass.
- Lint and production build pass.
- The API and cache boundary is ready for continued development.
