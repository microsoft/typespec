/**
 * Utilities to validate that the `uri` declared in a `mockapi.ts` mock API definition is
 * consistent with the route the generated client actually calls (the operation's HTTP route).
 *
 * The mock server serves requests on the `uri` from `mockapi.ts`, while generated clients call
 * the route resolved from `main.tsp`. If they diverge the generated client gets a 404 at runtime,
 * so we want CI to detect such a mismatch.
 *
 * The comparison is intentionally tolerant so it never produces false positives on legitimate
 * specs:
 * - The server endpoint portion of the `uri` is ignored. It is configured by the client at
 *   runtime and may legitimately differ from the spec's `@server` template (e.g. a multi-version
 *   service whose mock serves several `client:vN` endpoints). Only the operation route portion is
 *   compared.
 * - Route template parameters (`{param}`) are treated as wildcards because the concrete value is
 *   unknown. A whole-segment parameter may also span multiple uri segments or be absent to account
 *   for reserved/path expansions (e.g. ARM `{resourceUri}` scopes, `{+param}`).
 * - Trailing slashes and query strings are ignored.
 */

/**
 * Normalize a mock API `uri` so it can be compared against a spec route.
 *
 * - Drops any query string (routes are compared on their path only).
 * - Removes backslash escapes (e.g. `\:` used to escape `:` for the express router).
 */
export function normalizeMockApiUri(uri: string): string {
  return uri.split("?")[0].replace(/\\(.)/g, "$1");
}

/**
 * Split a route/uri into path segments on `/`, ignoring any `/` that appears inside a URI template
 * expression (e.g. the `/` in `record{/param}`).
 */
function splitSegments(path: string): string[] {
  const segments: string[] = [];
  let current = "";
  let depth = 0;
  for (const char of path) {
    if (char === "{") {
      depth++;
      current += char;
    } else if (char === "}") {
      if (depth > 0) {
        depth--;
      }
      current += char;
    } else if (char === "/" && depth === 0) {
      segments.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  segments.push(current);
  return segments;
}

/** Split into path segments dropping the leading (leading `/`) and trailing (trailing `/`) empties. */
function toSegments(path: string): string[] {
  const segments = splitSegments(path);
  while (segments.length > 0 && segments[0] === "") {
    segments.shift();
  }
  while (segments.length > 0 && segments[segments.length - 1] === "") {
    segments.pop();
  }
  return segments;
}

/**
 * Number of path segments contributed by a service `@server` url. These segments are part of the
 * endpoint the client configures, not the operation route, so they are skipped when comparing a
 * mock uri against an operation route.
 */
export function getServerPathPrefixSegmentCount(serverUrl: string | undefined): number {
  if (!serverUrl) {
    return 0;
  }
  let path: string;
  if (serverUrl.includes("{endpoint}")) {
    path = serverUrl.split("{endpoint}")[1] ?? "";
  } else if (serverUrl.includes("localhost:3000")) {
    path = serverUrl.split("localhost:3000")[1] ?? "";
  } else {
    try {
      path = new URL(serverUrl).pathname;
    } catch {
      path = "";
    }
  }
  return toSegments(path.split("?")[0]).length;
}

function escapeLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Build a regex pattern for a single segment that may embed template params (e.g. `primitive{param}`). */
function segmentPattern(segment: string): string {
  let pattern = "";
  let i = 0;
  while (i < segment.length) {
    if (segment[i] === "{") {
      const end = segment.indexOf("}", i);
      // The parameter value is unknown. Allow it to span the rest of the segment (and, for
      // path/reserved expansions, into following segments) without crossing a query string.
      pattern += "[^?]*?";
      i = end === -1 ? segment.length : end + 1;
    } else {
      pattern += escapeLiteral(segment[i]);
      i++;
    }
  }
  return pattern;
}

function buildRouteRegExp(routePath: string): RegExp {
  const segments = toSegments(routePath.split("?")[0]);
  let pattern = "";
  for (const segment of segments) {
    if (/^\{[^}]*\}$/.test(segment)) {
      // Whole-segment parameter: optional and may span several uri segments to account for
      // reserved/path expansions (e.g. ARM `{resourceUri}` scopes, `{+param}`).
      pattern += "(?:/[^?]+?)?";
    } else {
      pattern += "/" + segmentPattern(segment);
    }
  }
  if (pattern === "") {
    pattern = "/?";
  }
  // Allow the uri to carry extra trailing segments that are not part of the operation route (e.g.
  // server-driven pagination continuation pages like `.../link/nextPage` that the mock serves but
  // that are not declared operations in the spec).
  return new RegExp(`^${pattern}(?:/[^?]+)*/?$`);
}

/**
 * Check whether a mock API `uri` is consistent with an operation's HTTP `routePath`.
 *
 * @param routePath The server-relative route resolved from the spec (e.g. from `getAllHttpServices`).
 * @param uri The `uri` declared in the mock api.
 * @param serverPrefixSegmentCount Number of leading uri segments contributed by the `@server` url,
 *   which are skipped before comparing (see {@link getServerPathPrefixSegmentCount}).
 */
export function isMockApiUriConsistentWithRoute(
  routePath: string,
  uri: string,
  serverPrefixSegmentCount = 0,
): boolean {
  const uriSegments = toSegments(normalizeMockApiUri(uri));
  if (uriSegments.length < serverPrefixSegmentCount) {
    return false;
  }
  const remainder = "/" + uriSegments.slice(serverPrefixSegmentCount).join("/");
  return buildRouteRegExp(routePath).test(remainder);
}
