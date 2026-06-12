/**
 * Utilities to validate that the `uri` declared in a `mockapi.ts` mock API definition is
 * consistent with the route defined in the corresponding `main.tsp` spec.
 *
 * The mock server serves requests on the `uri` from `mockapi.ts`, while generated clients call
 * the route defined in `main.tsp`. If they diverge the generated client gets a 404 at runtime, so
 * we want CI to detect such a mismatch.
 */

/**
 * Normalize a mock API `uri` so it can be compared against a spec route.
 *
 * - Drops any query string (routes do not include the query in their path).
 * - Removes backslash escapes (e.g. `\:` used to escape `:` for the express router).
 */
export function normalizeMockApiUri(uri: string): string {
  return uri.split("?")[0].replace(/\\(.)/g, "$1");
}

function segmentToRegExp(segment: string): RegExp {
  let pattern = "";
  let i = 0;
  while (i < segment.length) {
    if (segment[i] === "{") {
      // URI template expression (e.g. `{param}`, `{+param}`, `{param*}`, `{/param}`).
      // The concrete value is unknown, so match anything within the segment. Segments never
      // contain a `/` (the path is already split on `/`), so restrict the wildcard accordingly.
      const end = segment.indexOf("}", i);
      pattern += "[^/]*";
      i = end === -1 ? segment.length : end + 1;
    } else {
      pattern += segment[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      i++;
    }
  }
  return new RegExp(`^${pattern}$`);
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

/**
 * Check whether a mock API `uri` is consistent with a spec route `template`.
 *
 * The comparison is done segment by segment. Segments containing a URI template expression
 * (`{...}`) are treated as wildcards because the concrete value is unknown. Literal segments must
 * match exactly. Path parameters that are not part of the route template (e.g. `@path` annotated
 * params, server-templated api-versions, reserved expansions) are appended to the `uri` as extra
 * segments, so the `uri` is allowed to have more segments than the route template.
 */
export function isMockApiUriConsistentWithRoute(template: string, uri: string): boolean {
  const templateSegments = splitSegments(template.split("?")[0]);
  const uriSegments = splitSegments(normalizeMockApiUri(uri));
  const length = Math.min(templateSegments.length, uriSegments.length);
  for (let i = 0; i < length; i++) {
    const templateSegment = templateSegments[i];
    const uriSegment = uriSegments[i];
    if (templateSegment.includes("{")) {
      if (!segmentToRegExp(templateSegment).test(uriSegment)) {
        return false;
      }
    } else if (templateSegment !== uriSegment) {
      return false;
    }
  }
  return true;
}
