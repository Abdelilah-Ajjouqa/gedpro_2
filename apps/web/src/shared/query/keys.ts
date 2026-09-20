export type QueryScope = `user:${number}`;

export const queryKeys = {
  session: () => ['session', 'current-user'] as const,
  list: <T extends Record<string, unknown>>(domain: string, scope: QueryScope, filters: T) => [domain, scope, 'list', filters] as const,
  detail: (domain: string, scope: QueryScope, id: string | number) => [domain, scope, 'detail', id] as const,
};
