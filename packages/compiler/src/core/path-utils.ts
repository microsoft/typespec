// Forked from https://github.com/microsoft/TypeScript/blob/663b19fe4a7c4d4ddaa61aedadd28da06acd27b6/src/compiler/path.ts

/**
 * Internally, we represent paths as strings with '/' as the directory separator.
 * When we make system calls (eg: LanguageServiceHost.getDirectory()),
 * we expect the host to correctly handle paths in our specified format.
 */
export const directorySeparator = "/";
export const altDirectorySeparator = "\\";
const urlSchemeSeparator = "://";
const backslashRegExp = /\\/g;
const relativePathSegmentRegExp = /(?:\/\/)|(?:^|\/)\.\.?(?:$|\/)/;

//#region Path Tests
/**
 * Determines whether a charCode corresponds to `/` or `\`.
 */
export function isAnyDirectorySeparator(charCode: number): boolean {
  return charCode === CharacterCodes.slash || charCode === CharacterCodes.backslash;
}

/**
 * Determines whether a path starts with a URL scheme (e.g. starts with `http://`, `ftp://`, `file://`, etc.).
 */
export function isUrl(path: string) {
  return getEncodedRootLength(path) < 0;
}

/*
 * Determines whether a path starts with an absolute path component (i.e. `/`, `c:/`, `file://`, etc.).
 *
 * ```ts
 * // POSIX
 * isPathAbsolute("/path/to/file.ext") === true
 * // DOS
 * isPathAbsolute("c:/path/to/file.ext") === true
 * // URL
 * isPathAbsolute("file:///path/to/file.ext") === true
 * // Non-absolute
 * isPathAbsolute("path/to/file.ext") === false
 * isPathAbsolute("./path/to/file.ext") === false
 * ```
 */
export function isPathAbsolute(path: string): boolean {
  return getEncodedRootLength(path) !== 0;
}
//#endregion

//#region Path Parsing

function isVolumeCharacter(charCode: number) {
  return (
    (charCode >= CharacterCodes.a && charCode <= CharacterCodes.z) ||
    (charCode >= CharacterCodes.A && charCode <= CharacterCodes.Z)
  );
}

function getFileUrlVolumeSeparatorEnd(url: string, start: number) {
  const ch0 = url.charCodeAt(start);
  if (ch0 === CharacterCodes.colon) return start + 1;
  if (ch0 === CharacterCodes.percent && url.charCodeAt(start + 1) === CharacterCodes._3) {
    const ch2 = url.charCodeAt(start + 2);
    if (ch2 === CharacterCodes.a || ch2 === CharacterCodes.A) return start + 3;
  }
  return -1;
}

/**
 * Returns length of the root part of a path or URL (i.e. length of "/", "x:/", "//server/share/, file:///user/files").
 *
 * For example:
 * ```ts
 * getRootLength("a") === 0                   // ""
 * getRootLength("/") === 1                   // "/"
 * getRootLength("c:") === 2                  // "c:"
 * getRootLength("c:d") === 0                 // ""
 * getRootLength("c:/") === 3                 // "c:/"
 * getRootLength("c:\\") === 3                // "c:\\"
 * getRootLength("//server") === 7            // "//server"
 * getRootLength("//server/share") === 8      // "//server/"
 * getRootLength("\\\\server") === 7          // "\\\\server"
 * getRootLength("\\\\server\\share") === 8   // "\\\\server\\"
 * getRootLength("file:///path") === 8        // "file:///"
 * getRootLength("file:///c:") === 10         // "file:///c:"
 * getRootLength("file:///c:d") === 8         // "file:///"
 * getRootLength("file:///c:/path") === 11    // "file:///c:/"
 * getRootLength("file://server") === 13      // "file://server"
 * getRootLength("file://server/path") === 14 // "file://server/"
 * getRootLength("http://server") === 13      // "http://server"
 * getRootLength("http://server/path") === 14 // "http://server/"
 * ```
 */
export function getRootLength(path: string) {
  const rootLength = getEncodedRootLength(path);
  return rootLength < 0 ? ~rootLength : rootLength;
}
/**
 * Returns length of the root part of a path or URL (i.e. length of "/", "x:/", "//server/share/, file:///user/files").
 * If the root is part of a URL, the twos-complement of the root length is returned.
 */
function getEncodedRootLength(path: string): number {
  if (!path) return 0;
  const ch0 = path.charCodeAt(0);

  // POSIX or UNC
  if (ch0 === CharacterCodes.slash || ch0 === CharacterCodes.backslash) {
    if (path.charCodeAt(1) !== ch0) return 1; // POSIX: "/" (or non-normalized "\")

    const p1 = path.indexOf(
      ch0 === CharacterCodes.slash ? directorySeparator : altDirectorySeparator,
      2,
    );
    if (p1 < 0) return path.length; // UNC: "//server" or "\\server"

    return p1 + 1; // UNC: "//server/" or "\\server\"
  }

  // DOS
  if (isVolumeCharacter(ch0) && path.charCodeAt(1) === CharacterCodes.colon) {
    const ch2 = path.charCodeAt(2);
    if (ch2 === CharacterCodes.slash || ch2 === CharacterCodes.backslash) return 3; // DOS: "c:/" or "c:\"
    if (path.length === 2) return 2; // DOS: "c:" (but not "c:d")
  }

  // URL
  const schemeEnd = path.indexOf(urlSchemeSeparator);
  if (schemeEnd !== -1) {
    const authorityStart = schemeEnd + urlSchemeSeparator.length;
    const authorityEnd = path.indexOf(directorySeparator, authorityStart);
    if (authorityEnd !== -1) {
      // URL: "file:///", "file://server/", "file://server/path"
      // For local "file" URLs, include the leading DOS volume (if present).
      // Per https://www.ietf.org/rfc/rfc1738.txt, a host of "" or "localhost" is a
      // special case interpreted as "the machine from which the URL is being interpreted".
      const scheme = path.slice(0, schemeEnd);
      const authority = path.slice(authorityStart, authorityEnd);
      if (
        scheme === "file" &&
        (authority === "" || authority === "localhost") &&
        isVolumeCharacter(path.charCodeAt(authorityEnd + 1))
      ) {
        const volumeSeparatorEnd = getFileUrlVolumeSeparatorEnd(path, authorityEnd + 2);
        if (volumeSeparatorEnd !== -1) {
          if (path.charCodeAt(volumeSeparatorEnd) === CharacterCodes.slash) {
            // URL: "file:///c:/", "file://localhost/c:/", "file:///c%3a/", "file://localhost/c%3a/"
            return ~(volumeSeparatorEnd + 1);
          }
          if (volumeSeparatorEnd === path.length) {
            // URL: "file:///c:", "file://localhost/c:", "file:///c$3a", "file://localhost/c%3a"
            // but not "file:///c:d" or "file:///c%3ad"
            return ~volumeSeparatorEnd;
          }
        }
      }
      return ~(authorityEnd + 1); // URL: "file://server/", "http://server/"
    }
    return ~path.length; // URL: "file://server", "http://server"
  }

  // relative
  return 0;
}

export function getDirectoryPath(path: string): string {
  path = normalizeSlashes(path);

  // If the path provided is itself the root, then return it.
  const rootLength = getRootLength(path);
  if (rootLength === path.length) return path;

  // return the leading portion of the path up to the last (non-terminal) directory separator
  // but not including any trailing directory separator.
  path = removeTrailingDirectorySeparator(path);
  return path.slice(0, Math.max(rootLength, path.lastIndexOf(directorySeparator)));
}

/**
 * Returns the path except for its containing directory name.
 * Semantics align with NodeJS's `path.basename` except that we support URL's as well.
 *
 * ```ts
 * // POSIX
 * getBaseFileName("/path/to/file.ext") === "file.ext"
 * getBaseFileName("/path/to/") === "to"
 * getBaseFileName("/") === ""
 * // DOS
 * getBaseFileName("c:/path/to/file.ext") === "file.ext"
 * getBaseFileName("c:/path/to/") === "to"
 * getBaseFileName("c:/") === ""
 * getBaseFileName("c:") === ""
 * // URL
 * getBaseFileName("http://typescriptlang.org/path/to/file.ext") === "file.ext"
 * getBaseFileName("http://typescriptlang.org/path/to/") === "to"
 * getBaseFileName("http://typescriptlang.org/") === ""
 * getBaseFileName("http://typescriptlang.org") === ""
 * getBaseFileName("file://server/path/to/file.ext") === "file.ext"
 * getBaseFileName("file://server/path/to/") === "to"
 * getBaseFileName("file://server/") === ""
 * getBaseFileName("file://server") === ""
 * getBaseFileName("file:///path/to/file.ext") === "file.ext"
 * getBaseFileName("file:///path/to/") === "to"
 * getBaseFileName("file:///") === ""
 * getBaseFileName("file://") === ""
 * ```
 */
export function getBaseFileName(path: string): string {
  path = normalizeSlashes(path);

  // if the path provided is itself the root, then it has not file name.
  const rootLength = getRootLength(path);
  if (rootLength === path.length) return "";

  // return the trailing portion of the path starting after the last (non-terminal) directory
  // separator but not including any trailing directory separator.
  path = removeTrailingDirectorySeparator(path);
  return path.slice(Math.max(getRootLength(path), path.lastIndexOf(directorySeparator) + 1));
}

/**
 * Gets the file extension for a path.
 * Normalizes it to lower case.
 *
 * ```ts
 * getAnyExtensionFromPath("/path/to/file.ext") === ".ext"
 * getAnyExtensionFromPath("/path/to/file.ext/") === ".ext"
 * getAnyExtensionFromPath("/path/to/file") === ""
 * getAnyExtensionFromPath("/path/to.ext/file") === ""
 * ```
 */
export function getAnyExtensionFromPath(path: string): string {
  // Retrieves any string from the final "." onwards from a base file name.
  // Unlike extensionFromPath, which throws an exception on unrecognized extensions.
  const baseFileName = getBaseFileName(path);
  const extensionIndex = baseFileName.lastIndexOf(".");
  if (extensionIndex >= 0) {
    return baseFileName.substring(extensionIndex).toLowerCase();
  }
  return "";
}

function pathComponents(path: string, rootLength: number) {
  const root = path.substring(0, rootLength);
  const rest = path.substring(rootLength).split(directorySeparator);
  if (rest.length && !rest[rest.length - 1]) rest.pop();
  return [root, ...rest];
}

/**
 * Parse a path into an array containing a root component (at index 0) and zero or more path
 * components (at indices > 0). The result is not normalized.
 * If the path is relative, the root component is `""`.
 * If the path is absolute, the root component includes the first path separator (`/`).
 *
 * ```ts
 * // POSIX
 * getPathComponents("/path/to/file.ext") === ["/", "path", "to", "file.ext"]
 * getPathComponents("/path/to/") === ["/", "path", "to"]
 * getPathComponents("/") === ["/"]
 * // DOS
 * getPathComponents("c:/path/to/file.ext") === ["c:/", "path", "to", "file.ext"]
 * getPathComponents("c:/path/to/") === ["c:/", "path", "to"]
 * getPathComponents("c:/") === ["c:/"]
 * getPathComponents("c:") === ["c:"]
 * // URL
 * getPathComponents("http://typescriptlang.org/path/to/file.ext") === ["http://typescriptlang.org/", "path", "to", "file.ext"]
 * getPathComponents("http://typescriptlang.org/path/to/") === ["http://typescriptlang.org/", "path", "to"]
 * getPathComponents("http://typescriptlang.org/") === ["http://typescriptlang.org/"]
 * getPathComponents("http://typescriptlang.org") === ["http://typescriptlang.org"]
 * getPathComponents("file://server/path/to/file.ext") === ["file://server/", "path", "to", "file.ext"]
 * getPathComponents("file://server/path/to/") === ["file://server/", "path", "to"]
 * getPathComponents("file://server/") === ["file://server/"]
 * getPathComponents("file://server") === ["file://server"]
 * getPathComponents("file:///path/to/file.ext") === ["file:///", "path", "to", "file.ext"]
 * getPathComponents("file:///path/to/") === ["file:///", "path", "to"]
 * getPathComponents("file:///") === ["file:///"]
 * getPathComponents("file://") === ["file://"]
 * ```
 */
export function getPathComponents(path: string, currentDirectory = "") {
  path = joinPaths(currentDirectory, path);
  return pathComponents(path, getRootLength(path));
}

//#endregion

//#region Path Formatting
/**
 * Reduce an array of path components to a more simplified path by navigating any
 * `"."` or `".."` entries in the path.
 */
export function reducePathComponents(components: readonly string[]) {
  if (!components.some((x) => x !== undefined)) return [];
  const reduced = [components[0]];
  for (let i = 1; i < components.length; i++) {
    const component = components[i];
    if (!component) continue;
    if (component === ".") continue;
    if (component === "..") {
      if (reduced.length > 1) {
        if (reduced[reduced.length - 1] !== "..") {
          reduced.pop();
          continue;
        }
      } else if (reduced[0]) continue;
    }
    reduced.push(component);
  }
  return reduced;
}

/**
 * Combines paths. If a path is absolute, it replaces any previous path. Relative paths are not simplified.
 *
 * ```ts
 * // Non-rooted
 * joinPaths("path", "to", "file.ext") === "path/to/file.ext"
 * joinPaths("path", "dir", "..", "to", "file.ext") === "path/dir/../to/file.ext"
 * // POSIX
 * joinPaths("/path", "to", "file.ext") === "/path/to/file.ext"
 * joinPaths("/path", "/to", "file.ext") === "/to/file.ext"
 * // DOS
 * joinPaths("c:/path", "to", "file.ext") === "c:/path/to/file.ext"
 * joinPaths("c:/path", "c:/to", "file.ext") === "c:/to/file.ext"
 * // URL
 * joinPaths("file:///path", "to", "file.ext") === "file:///path/to/file.ext"
 * joinPaths("file:///path", "file:///to", "file.ext") === "file:///to/file.ext"
 * ```
 */
export function joinPaths(path: string, ...paths: (string | undefined)[]): string {
  if (path) path = normalizeSlashes(path);
  for (let relativePath of paths) {
    if (!relativePath) continue;
    relativePath = normalizeSlashes(relativePath);
    if (!path || getRootLength(relativePath) !== 0) {
      path = relativePath;
    } else {
      path = ensureTrailingDirectorySeparator(path) + relativePath;
    }
  }
  return path;
}

/**
 * Combines and resolves paths. If a path is absolute, it replaces any previous path. Any
 * `.` and `..` path components are resolved. Trailing directory separators are preserved.
 *
 * ```ts
 * resolvePath("/path", "to", "file.ext") === "path/to/file.ext"
 * resolvePath("/path", "to", "file.ext/") === "path/to/file.ext/"
 * resolvePath("/path", "dir", "..", "to", "file.ext") === "path/to/file.ext"
 * ```
 */
export function resolvePath(path: string, ...paths: (string | undefined)[]): string {
  return normalizePath(
    paths.some((x) => x !== undefined) ? joinPaths(path, ...paths) : normalizeSlashes(path),
  );
}

/**
 * Parse a path into an array containing a root component (at index 0) and zero or more path
 * components (at indices > 0). The result is normalized.
 * If the path is relative, the root component is `""`.
 * If the path is absolute, the root component includes the first path separator (`/`).
 *
 * ```ts
 * getNormalizedPathComponents("to/dir/../file.ext", "/path/") === ["/", "path", "to", "file.ext"]
 * ```
 */
export function getNormalizedPathComponents(path: string, currentDirectory: string | undefined) {
  return reducePathComponents(getPathComponents(path, currentDirectory));
}

export function getNormalizedAbsolutePath(fileName: string, currentDirectory: string | undefined) {
  return getPathFromPathComponents(getNormalizedPathComponents(fileName, currentDirectory));
}

export function normalizePath(path: string): string {
  path = normalizeSlashes(path);
  // Most paths don't require normalization
  if (!relativePathSegmentRegExp.test(path)) {
    return path;
  }
  // Some paths only require cleanup of `/./` or leading `./`
  const simplified = path.replace(/\/\.\//g, "/").replace(/^\.\//, "");
  if (simplified !== path) {
    path = simplified;
    if (!relativePathSegmentRegExp.test(path)) {
      return path;
    }
  }
  // Other paths require full normalization
  const normalized = getPathFromPathComponents(reducePathComponents(getPathComponents(path)));
  return normalized && hasTrailingDirectorySeparator(path)
    ? ensureTrailingDirectorySeparator(normalized)
    : normalized;
}

//#endregion

function getPathWithoutRoot(pathComponents: readonly string[]) {
  if (pathComponents.length === 0) return "";
  return pathComponents.slice(1).join(directorySeparator);
}

export function getNormalizedAbsolutePathWithoutRoot(
  fileName: string,
  currentDirectory: string | undefined,
) {
  return getPathWithoutRoot(getNormalizedPathComponents(fileName, currentDirectory));
}

/**
 * Formats a parsed path consisting of a root component (at index 0) and zero or more path
 * segments (at indices > 0).
 *
 * ```ts
 * getPathFromPathComponents(["/", "path", "to", "file.ext"]) === "/path/to/file.ext"
 * ```
 */
export function getPathFromPathComponents(pathComponents: readonly string[]) {
  if (pathComponents.length === 0) return "";

  const root = pathComponents[0] && ensureTrailingDirectorySeparator(pathComponents[0]);
  return root + pathComponents.slice(1).join(directorySeparator);
}

//#region Path mutation
/**
 * Removes a trailing directory separator from a path, if it does not already have one.
 *
 * ```ts
 * removeTrailingDirectorySeparator("/path/to/file.ext") === "/path/to/file.ext"
 * removeTrailingDirectorySeparator("/path/to/file.ext/") === "/path/to/file.ext"
 * ```
 */
export function removeTrailingDirectorySeparator(path: string): string;
export function removeTrailingDirectorySeparator(path: string) {
  if (hasTrailingDirectorySeparator(path)) {
    return path.substring(0, path.length - 1);
  }

  return path;
}

export function ensureTrailingDirectorySeparator(path: string): string {
  if (!hasTrailingDirectorySeparator(path)) {
    return path + directorySeparator;
  }

  return path;
}

/**
 * Determines whether a path has a trailing separator (`/` or `\\`).
 */
export function hasTrailingDirectorySeparator(path: string) {
  return path.length > 0 && isAnyDirectorySeparator(path.charCodeAt(path.length - 1));
}

/**
 * Normalize path separators, converting `\` into `/`.
 */
export function normalizeSlashes(path: string): string {
  const index = path.indexOf("\\");
  if (index === -1) {
    return path;
  }
  backslashRegExp.lastIndex = index; // prime regex with known position
  return path.replace(backslashRegExp, directorySeparator);
}

//#endregion
// #region relative paths
type GetCanonicalFileName = (fileName: string) => string;

/** @internal */
function equateValues<T>(a: T, b: T) {
  return a === b;
}

/**
 * Compare the equality of two strings using a case-sensitive ordinal comparison.
 *
 * Case-sensitive comparisons compare both strings one code-point at a time using the integer
 * value of each code-point after applying `toUpperCase` to each string. We always map both
 * strings to their upper-case form as some unicode characters do not properly round-trip to
 * lowercase (such as `ẞ` (German sharp capital s)).
 *
 * @internal
 */
function equateStringsCaseInsensitive(a: string, b: string) {
  return a === b || (a !== undefined && b !== undefined && a.toUpperCase() === b.toUpperCase());
}

/**
 * Compare the equality of two strings using a case-sensitive ordinal comparison.
 *
 * Case-sensitive comparisons compare both strings one code-point at a time using the
 * integer value of each code-point.
 *
 * @internal
 */
function equateStringsCaseSensitive(a: string, b: string) {
  return equateValues(a, b);
}

/**
 * Returns its argument.
 *
 * @internal
 */
function identity<T>(x: T) {
  return x;
}

/**
 * Determines whether a path starts with an absolute path component (i.e. `/`, `c:/`, `file://`, etc.).
 *
 * ```ts
 * // POSIX
 * pathIsAbsolute("/path/to/file.ext") === true
 * // DOS
 * pathIsAbsolute("c:/path/to/file.ext") === true
 * // URL
 * pathIsAbsolute("file:///path/to/file.ext") === true
 * // Non-absolute
 * pathIsAbsolute("path/to/file.ext") === false
 * pathIsAbsolute("./path/to/file.ext") === false
 * ```
 *
 * @internal
 */
function pathIsAbsolute(path: string): boolean {
  return getEncodedRootLength(path) !== 0;
}

/**
 * Determines whether a path starts with a relative path component (i.e. `.` or `..`).
 *
 * @internal
 */
function pathIsRelative(path: string): boolean {
  return /^\.\.?($|[\\/])/.test(path);
}

/**
 * Ensures a path is either absolute (prefixed with `/` or `c:`) or dot-relative (prefixed
 * with `./` or `../`) so as not to be confused with an unprefixed module name.
 *
 * ```ts
 * ensurePathIsNonModuleName("/path/to/file.ext") === "/path/to/file.ext"
 * ensurePathIsNonModuleName("./path/to/file.ext") === "./path/to/file.ext"
 * ensurePathIsNonModuleName("../path/to/file.ext") === "../path/to/file.ext"
 * ensurePathIsNonModuleName("path/to/file.ext") === "./path/to/file.ext"
 * ```
 *
 * @internal
 */
export function ensurePathIsNonModuleName(path: string): string {
  return !pathIsAbsolute(path) && !pathIsRelative(path) ? "./" + path : path;
}

/** @internal */
function getPathComponentsRelativeTo(
  from: string,
  to: string,
  stringEqualityComparer: (a: string, b: string) => boolean,
  getCanonicalFileName: GetCanonicalFileName,
) {
  const fromComponents = reducePathComponents(getPathComponents(from));
  const toComponents = reducePathComponents(getPathComponents(to));

  let start: number;
  for (start = 0; start < fromComponents.length && start < toComponents.length; start++) {
    const fromComponent = getCanonicalFileName(fromComponents[start]);
    const toComponent = getCanonicalFileName(toComponents[start]);
    const comparer = start === 0 ? equateStringsCaseInsensitive : stringEqualityComparer;
    if (!comparer(fromComponent, toComponent)) break;
  }

  if (start === 0) {
    return toComponents;
  }

  const components = toComponents.slice(start);
  const relative: string[] = [];
  for (; start < fromComponents.length; start++) {
    relative.push("..");
  }
  return ["", ...relative, ...components];
}

/**
 * Gets a relative path that can be used to traverse between `from` and `to`.
 */
export function getRelativePathFromDirectory(from: string, to: string, ignoreCase: boolean): string;
/**
 * Gets a relative path that can be used to traverse between `from` and `to`.
 */
export function getRelativePathFromDirectory(
  fromDirectory: string,
  to: string,
  getCanonicalFileName: GetCanonicalFileName,
): string;
export function getRelativePathFromDirectory(
  fromDirectory: string,
  to: string,
  getCanonicalFileNameOrIgnoreCase: GetCanonicalFileName | boolean,
) {
  if (getRootLength(fromDirectory) > 0 !== getRootLength(to) > 0) {
    throw new Error("Paths must either both be absolute or both be relative");
  }
  const getCanonicalFileName =
    typeof getCanonicalFileNameOrIgnoreCase === "function"
      ? getCanonicalFileNameOrIgnoreCase
      : identity;
  const ignoreCase =
    typeof getCanonicalFileNameOrIgnoreCase === "boolean"
      ? getCanonicalFileNameOrIgnoreCase
      : false;
  const pathComponents = getPathComponentsRelativeTo(
    fromDirectory,
    to,
    ignoreCase ? equateStringsCaseInsensitive : equateStringsCaseSensitive,
    getCanonicalFileName,
  );
  return getPathFromPathComponents(pathComponents);
}

// #endregion
const enum CharacterCodes {
  nullCharacter = 0,
  maxAsciiCharacter = 0x7f,

  lineFeed = 0x0a, // \n
  carriageReturn = 0x0d, // \r
  lineSeparator = 0x2028,
  paragraphSeparator = 0x2029,
  nextLine = 0x0085,

  // Unicode 3.0 space characters
  space = 0x0020, // " "
  nonBreakingSpace = 0x00a0, //
  enQuad = 0x2000,
  emQuad = 0x2001,
  enSpace = 0x2002,
  emSpace = 0x2003,
  threePerEmSpace = 0x2004,
  fourPerEmSpace = 0x2005,
  sixPerEmSpace = 0x2006,
  figureSpace = 0x2007,
  punctuationSpace = 0x2008,
  thinSpace = 0x2009,
  hairSpace = 0x200a,
  zeroWidthSpace = 0x200b,
  narrowNoBreakSpace = 0x202f,
  ideographicSpace = 0x3000,
  mathematicalSpace = 0x205f,
  ogham = 0x1680,

  _ = 0x5f,
  $ = 0x24,

  _0 = 0x30,
  _1 = 0x31,
  _2 = 0x32,
  _3 = 0x33,
  _4 = 0x34,
  _5 = 0x35,
  _6 = 0x36,
  _7 = 0x37,
  _8 = 0x38,
  _9 = 0x39,

  a = 0x61,
  b = 0x62,
  c = 0x63,
  d = 0x64,
  e = 0x65,
  f = 0x66,
  g = 0x67,
  h = 0x68,
  i = 0x69,
  j = 0x6a,
  k = 0x6b,
  l = 0x6c,
  m = 0x6d,
  n = 0x6e,
  o = 0x6f,
  p = 0x70,
  q = 0x71,
  r = 0x72,
  s = 0x73,
  t = 0x74,
  u = 0x75,
  v = 0x76,
  w = 0x77,
  x = 0x78,
  y = 0x79,
  z = 0x7a,

  A = 0x41,
  B = 0x42,
  C = 0x43,
  D = 0x44,
  E = 0x45,
  F = 0x46,
  G = 0x47,
  H = 0x48,
  I = 0x49,
  J = 0x4a,
  K = 0x4b,
  L = 0x4c,
  M = 0x4d,
  N = 0x4e,
  O = 0x4f,
  P = 0x50,
  Q = 0x51,
  R = 0x52,
  S = 0x53,
  T = 0x54,
  U = 0x55,
  V = 0x56,
  W = 0x57,
  X = 0x58,
  Y = 0x59,
  Z = 0x5a,

  ampersand = 0x26, // &
  asterisk = 0x2a, // *
  at = 0x40, // @
  backslash = 0x5c, // \
  backtick = 0x60, // `
  bar = 0x7c, // |
  caret = 0x5e, // ^
  closeBrace = 0x7d, // }
  closeBracket = 0x5d, // ]
  closeParen = 0x29, // )
  colon = 0x3a, // :
  comma = 0x2c, // ,
  dot = 0x2e, // .
  doubleQuote = 0x22, // "
  equals = 0x3d, // =
  exclamation = 0x21, // !
  greaterThan = 0x3e, // >
  hash = 0x23, // #
  lessThan = 0x3c, // <
  minus = 0x2d, // -
  openBrace = 0x7b, // {
  openBracket = 0x5b, // [
  openParen = 0x28, // (
  percent = 0x25, // %
  plus = 0x2b, // +
  question = 0x3f, // ?
  semicolon = 0x3b, // ;
  singleQuote = 0x27, // '
  slash = 0x2f, // /
  tilde = 0x7e, // ~

  backspace = 0x08, // \b
  formFeed = 0x0c, // \f
  byteOrderMark = 0xfeff,
  tab = 0x09, // \t
  verticalTab = 0x0b, // \v
}
