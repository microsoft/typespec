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
   * Get the display code for a canonical full code: the short form when the
   * library has an unambiguous short name, otherwise the full code unchanged.
   */
  getDisplayCode(fullCode: string): string;
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
  const fullToShort = new Map<string, string>();
  for (const [short, names] of shortToNames) {
    if (names.length === 1) {
      shortToFull.set(short, names[0]);
      fullToShort.set(names[0], short);
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

    getDisplayCode(fullCode) {
      const fullName = matchFullPackage(fullCode);
      if (fullName === undefined) {
        return fullCode;
      }
      const short = fullToShort.get(fullName);
      if (short === undefined) {
        return fullCode;
      }
      return `${short}/${fullCode.slice(fullName.length + 1)}`;
    },
  };
}
