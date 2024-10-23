import { printIdentifier } from "@typespec/compiler";

type ScopeAndName = { scope: string[]; name: string; rawName: string };
export function getScopeAndName(originalName: string): ScopeAndName {
  const path = originalName.split(".");
  const name = path.pop()!;

  return { scope: path.map(printIdentifier), name: printIdentifier(name), rawName: name };
}

export function scopesMatch(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((scope, i) => scope === b[i]);
}
