export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export const normalizePhone = (value?: string) =>
  value ? value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '') : undefined;
export const normalizeLabels = (values?: string[]) => [
  ...new Set((values ?? []).map((v) => v.trim().toLowerCase()).filter(Boolean)),
];
