/**
 * A lazy reference to a file on disk. Unlike embedding the file content directly, a
 * `FileRef` only describes *where* the content lives; it is resolved (read) by tooling
 * such as `tspd` when needed. Because it does not read the file at definition time, it is
 * safe to include in code that is bundled for the browser (e.g. the playground).
 */
export interface FileRef {
  readonly kind: "file-ref";
  /** Path to the file, relative to the package root. */
  readonly path: string;
}

export const fileRef = {
  /**
   * Create a {@link FileRef} pointing to a file relative to the package root (the directory
   * containing the library's `package.json`).
   *
   * @example
   * ```ts
   * docs: fileRef.fromPackageRoot("src/rules/my-rule.md"),
   * ```
   */
  fromPackageRoot(path: string): FileRef {
    return { kind: "file-ref", path };
  },
};

/** Type guard for {@link FileRef}. */
export function isFileRef(value: unknown): value is FileRef {
  return typeof value === "object" && value !== null && (value as FileRef).kind === "file-ref";
}
