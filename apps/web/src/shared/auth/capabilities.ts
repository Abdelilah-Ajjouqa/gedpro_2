export type Capability = string;

export function hasCapability(granted: readonly string[], required: string) {
  return granted.includes(required);
}

export function hasAnyCapability(
  granted: readonly string[],
  required: readonly string[],
) {
  return required.some((capability) => hasCapability(granted, capability));
}
