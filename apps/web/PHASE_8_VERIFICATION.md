# Phase 8 release verification

## Automated gates

Run the complete frontend gate from the repository root:

```text
npm run check --workspace @gedpro/web
```

This runs ESLint with zero warnings, strict TypeScript checking, and the optimized Next.js production build.

## Release checks completed

- The optimized build prerenders all current routes as static shells.
- Client boundaries are limited to authentication, query-backed dashboard interactions, theme controls, menus, sheets, and avatar error fallbacks.
- Dashboard loading, empty, API failure, mutation rollback, and route-level error states have accessible text and recovery paths.
- Status badges include text and do not rely on color alone.
- Images use `next/image` with fixed dimensions and initials fallbacks.
- The pipeline remains keyboard focusable and horizontally scrollable below wide-desktop sizes.
- Reduced-motion preferences suppress transitions and animations globally; candidate hover movement is motion-safe only.
- Light, dark, and system themes use semantic tokens and the root layout suppresses only the expected theme-class hydration difference.
- Authentication redirects accept only same-origin paths.

## Manual browser matrix

Before a production release, verify the authenticated dashboard at 1440 px, 1024 px, 768 px, and 390 px widths in a browser with live API data. Check keyboard order, visible focus, mobile navigation, all three theme choices, long candidate content, broken avatar URLs, empty API collections, failed API requests, and the browser/server consoles.
