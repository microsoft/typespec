import { relative } from "path";

export function unixify(path: string): string {
  return path.replace(/\\/g, "/");
}

export function relativeTo(from: string, to: string) {
  return unixify(relative(from, to));
}
