export type VersioningModule = typeof import("@typespec/versioning");

export async function resolveVersioningModule(): Promise<VersioningModule | undefined> {
  try {
    return await import("@typespec/versioning");
  } catch {
    return undefined;
  }
}
