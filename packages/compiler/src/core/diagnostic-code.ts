/**
 * Utilities to compute and resolve short (scope-stripped or library-aliased)
 * diagnostic/linter-rule codes.
 *
 * Full diagnostic codes and linter rule ids have the form `${packageName}/${code}`
 * (e.g. `@typespec/http/no-foo`). Those are verbose, so the compiler also accepts
 * short forms where the package scope is stripped (`http/no-foo`) or replaced by a
 * library-declared alias (`tcgc/no-foo`).
 */

/** Information about a loaded library used to compute short diagnostic codes. */
export interface LibraryNameInfo {
  /** Full package name e.g. `@typespec/http`. Matches package.json name. */
  readonly name: string;
  /** Optional library-declared alias e.g. `tcgc`. Overrides the auto-stripped name. */
  readonly alias?: string;
}

/**
 * Resolve short/full diagnostic codes for a given set of loaded libraries.
 */
export interface DiagnosticCodeResolver {
  /**
   * Normalize a user-provided code (short or full) to its canonical full
   * `${packageName}/${code}` form. If the code cannot be resolved (unknown short
   * name, ambiguous short name, or a bare compiler code) it is returned unchanged.
   */
  resolveCode(code: string): string;

  /**
   * If `code`'s leading short-name segment maps to two or more loaded libraries,
   * return the ambiguity information; otherwise return `undefined`. A full code
   * that is already prefixed with a known package is never ambiguous.
   */
  getAmbiguousShortName(
    code: string,
  ): { shortName: string; candidates: readonly string[] } | undefined;
}

/**
 * Compute the short name of a package by stripping the TypeSpec scope or applying
 * a library-declared alias.
 *
 * - An explicit `alias` always wins.
 * - `@typespec/<name>` -> `<name>`
 * - `@<scope>/typespec-<name>` -> `<name>`
 * - `typespec-<name>` -> `<name>`
 * - otherwise there is no short form (returns `undefined`).
 */
export function getPackageShortName(name: string, alias?: string): string | undefined {
  if (alias !== undefined && alias !== "") {
    return alias;
  }

  const typespecScope = /^@typespec\/(.+)$/.exec(name);
  if (typespecScope) {
    return typespecScope[1];
  }

  const scopedTypespecPrefix = /^@[^/]+\/typespec-(.+)$/.exec(name);
  if (scopedTypespecPrefix) {
    return scopedTypespecPrefix[1];
  }

  const unscopedTypespecPrefix = /^typespec-(.+)$/.exec(name);
  if (unscopedTypespecPrefix) {
    return unscopedTypespecPrefix[1];
  }

  return undefined;
}

/** Format the conflicting full package names of an ambiguous short name for display. */
export function formatShortNameCandidates(candidates: readonly string[]): string {
  return candidates.map((name) => `"${name}"`).join(", ");
}

/**
 * Pattern a library `alias` must match: a non-empty, kebab-case identifier made of
 * lowercase letters and digits, with single hyphens allowed between segments (no
 * leading/trailing/double hyphens, no uppercase, whitespace or other characters).
 * The alias is used as a diagnostic/linter code prefix (e.g. `tcgc/no-foo`), so it
 * must not contain a `/` and should look like the scope-stripped package names it
 * replaces (e.g. `client-generator-core`).
 */
const libraryAliasPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Returns whether `alias` is a valid library alias (see {@link libraryAliasPattern}). */
export function isValidLibraryAlias(alias: string): boolean {
  return libraryAliasPattern.test(alias);
}

/**
 * Create a resolver mapping between full and short diagnostic codes for the given
 * loaded libraries. When two libraries would resolve to the same short name, that
 * short name is considered ambiguous and all conflicting libraries fall back to
 * their full name for both resolution and display.
 */
export function createDiagnosticCodeResolver(
  libraries: Iterable<LibraryNameInfo>,
): DiagnosticCodeResolver {
  const shortToNames = new Map<string, string[]>();
  const fullNames: string[] = [];

  for (const lib of libraries) {
    fullNames.push(lib.name);
    const short = getPackageShortName(lib.name, lib.alias);
    if (short !== undefined) {
      const existing = shortToNames.get(short);
      if (existing) {
        existing.push(lib.name);
      } else {
        shortToNames.set(short, [lib.name]);
      }
    }
  }

  const shortToFull = new Map<string, string>();
  const ambiguousShortNames = new Map<string, string[]>();
  for (const [short, names] of shortToNames) {
    if (names.length === 1) {
      shortToFull.set(short, names[0]);
    } else {
      ambiguousShortNames.set(short, names);
    }
  }

  // Longest names first so that the most specific package prefix wins.
  const sortedFullNames = [...fullNames].sort((a, b) => b.length - a.length);

  function matchFullPackage(code: string): string | undefined {
    for (const name of sortedFullNames) {
      if (code.startsWith(`${name}/`)) {
        return name;
      }
    }
    return undefined;
  }

  return {
    resolveCode(code) {
      // Already a full code referencing a known library.
      if (matchFullPackage(code) !== undefined) {
        return code;
      }

      const separator = code.indexOf("/");
      if (separator === -1) {
        return code;
      }
      const shortName = code.slice(0, separator);
      const rest = code.slice(separator + 1);
      const fullName = shortToFull.get(shortName);
      if (fullName !== undefined) {
        return `${fullName}/${rest}`;
      }
      return code;
    },

    getAmbiguousShortName(code) {
      // A full code referencing a known library is never ambiguous.
      if (matchFullPackage(code) !== undefined) {
        return undefined;
      }

      const separator = code.indexOf("/");
      if (separator === -1) {
        return undefined;
      }
      const shortName = code.slice(0, separator);
      const candidates = ambiguousShortNames.get(shortName);
      if (candidates === undefined) {
        return undefined;
      }
      return { shortName, candidates };
    },
  };
}
