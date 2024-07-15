import { formatIdentifier } from "@typespec/compiler";

type ScopeAndName = { scope: string[]; name: string };
export function getScopeAndName(originalName: string): ScopeAndName {
  const path = originalName.split(".").map(formatIdentifier);
  const name = path.pop()!;

  return { scope: path, name };
}

export function scopesMatch(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((scope, i) => scope === b[i]);
}
