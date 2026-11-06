import { describe, expect, it } from 'vitest';
import {
  isRouteActive,
  navigationRoutes,
  releasedRoutesByGroup,
  releasedRoutesFor,
} from './routes';

describe('released route registry', () => {
  it('keeps unique destinations in the approved order', () => {
    const hrefs = navigationRoutes.map((route) => route.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs).toEqual([
      '/',
      '/candidates',
      '/jobs',
      '/applications',
      '/interviews',
      '/documents',
      '/forms',
      '/communications',
      '/reports',
      '/settings/pipelines',
      '/settings/scorecard-templates',
      '/settings/users',
    ]);
  });

  it('denies destinations when a capability is missing', () => {
    expect(releasedRoutesFor(['jobs:read']).map((route) => route.href)).toEqual(
      ['/jobs'],
    );
    expect(releasedRoutesFor([])).toEqual([]);
  });

  it('matches only a route or its descendants', () => {
    expect(isRouteActive('/jobs/12', '/jobs')).toBe(true);
    expect(isRouteActive('/jobs-board', '/jobs')).toBe(false);
    expect(isRouteActive('/applications', '/')).toBe(false);
  });

  it('groups destinations according to capability access', () => {
    const grouped = releasedRoutesByGroup([
      'dashboard:view',
      'candidates:read',
      'documents:list',
      'reports:read',
      'pipelines:read',
    ]);
    expect(grouped.work.map((r) => r.href)).toEqual(['/', '/candidates']);
    expect(grouped.operations.map((r) => r.href)).toEqual(['/documents']);
    expect(grouped.insights.map((r) => r.href)).toEqual(['/reports']);
    expect(grouped.settings.map((r) => r.href)).toEqual(['/settings/pipelines']);
  });
});
