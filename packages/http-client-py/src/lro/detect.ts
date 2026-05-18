import type { HttpOperation, HttpOperationResponse } from "@typespec/http";

/**
 * Names of HTTP response headers whose presence indicates a long-running
 * operation. Compared case-insensitively against the wire header names
 * surfaced by `@typespec/http`.
 *
 * `Operation-Location` is the modern unbranded convention used by Azure.Core
 * and several non-Azure services; `Location` is the older Azure Resource
 * Manager pattern. Matching both lets us pick up the bulk of real-world
 * services without depending on Azure.Core decorators.
 */
const LRO_STATUS_HEADERS = new Set(["operation-location", "location", "azure-asyncoperation"]);

/**
 * Result of LRO detection. Today this is just a boolean flag plus the result
 * type; it is a struct rather than a `boolean` so we can grow it (final state
 * via, polling strategy, status field, etc.) without churning the call sites.
 */
export interface LroMetadata {
  /** Whether the operation should be emitted as an LRO. */
  isLongRunning: boolean;
  /**
   * The final result type the poller should resolve to. `undefined` means the
   * poller resolves to `None` (e.g., a fire-and-forget LRO with no body).
   */
  finalResultType?: import("@typespec/compiler").Type;
}

/**
 * Heuristic LRO detection for the unbranded TypeSpec stack.
 *
 * `@typespec/http-client` does not model LROs today — that vocabulary lives
 * in `Azure.Core` (`@useFinalStateVia`, `@pollingOperation`, `@lroStatus`,
 * `@lroResult`, `@finalLocation`) and gets surfaced to branded emitters via
 * TCGC's `SdkLroServiceMethod`. Until an unbranded contract lands upstream,
 * we detect LROs by looking at the HTTP shape:
 *
 * - A response with status `202` (Accepted) — the conventional initial reply.
 * - A status header on that response (`Operation-Location`, `Location`, or
 *   `Azure-AsyncOperation`) — the polling URL the client should follow.
 *
 * This is intentionally narrow. False negatives are fine (users opt in by
 * shaping their TypeSpec response correctly); false positives would surprise
 * users so we keep the rule strict.
 *
 * @returns `LroMetadata` with `isLongRunning: false` when the heuristic
 *   doesn't match. Always returns a value so callers don't need to null-check.
 */
export function detectLro(httpOperation: HttpOperation): LroMetadata {
  let isLongRunning = false;
  let initialResponse: HttpOperationResponse | undefined;
  let finalResponse: HttpOperationResponse | undefined;

  for (const response of httpOperation.responses) {
    if (matches202(response.statusCodes) && hasLroHeader(response)) {
      isLongRunning = true;
      initialResponse = response;
      continue;
    }
    if (matchesSuccess(response.statusCodes) && !matches202(response.statusCodes)) {
      finalResponse = response;
    }
  }

  if (!isLongRunning) {
    return { isLongRunning: false };
  }

  const finalResultType = finalResponse?.type ?? initialResponse?.type;
  return { isLongRunning: true, finalResultType };
}

function matches202(codes: HttpOperationResponse["statusCodes"]): boolean {
  if (codes === 202) return true;
  if (codes === "*") return false;
  if (typeof codes === "object" && codes !== null) {
    return codes.start <= 202 && codes.end >= 202;
  }
  return false;
}

function matchesSuccess(codes: HttpOperationResponse["statusCodes"]): boolean {
  if (typeof codes === "number") {
    return codes >= 200 && codes < 300;
  }
  if (codes === "*") return false;
  if (typeof codes === "object" && codes !== null) {
    return codes.start < 300 && codes.end >= 200;
  }
  return false;
}

function hasLroHeader(response: HttpOperationResponse): boolean {
  for (const content of response.responses) {
    const headers = content.headers ?? {};
    for (const headerName of Object.keys(headers)) {
      if (LRO_STATUS_HEADERS.has(headerName.toLowerCase())) {
        return true;
      }
    }
  }
  return false;
}
