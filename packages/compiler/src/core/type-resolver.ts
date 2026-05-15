import type { Diagnostic, DiagnosticTarget, Node, Sym } from "./types.js";

/**
 * Identifies the kind of resolution being performed.
 * Each kind represents a distinct "question" that can be asked about a symbol.
 */
export enum ResolutionKind {
  /** Resolving the type of an alias */
  AliasTarget = "AliasTarget",
  /** Resolving the base type (extends/is) of a model or scalar */
  BaseType = "BaseType",
  /** Resolving a template constraint */
  Constraint = "Constraint",
  /** Resolving the value of a const statement */
  ConstValue = "ConstValue",
  /** Resolving an operation signature (op is) */
  OperationSignature = "OperationSignature",
  /** Resolving the type of a model property */
  PropertyType = "PropertyType",
  /** Resolving the type of a member accessed off a template parameter */
  MemberType = "MemberType",
}

/**
 * A resolution request represents a single unit of work the resolver is asked to compute.
 * The combination of (sym, kind) uniquely identifies a request.
 */
export interface ResolutionRequest {
  /** The kind of resolution being performed */
  readonly kind: ResolutionKind;
  /** The symbol whose resolution is requested */
  readonly sym: Sym;
  /** The AST node that triggered this resolution (used for diagnostics) */
  readonly node: Node;
  /** Human-readable description for cycle diagnostics (e.g., "Model 'Foo'") */
  readonly description: string;
}

/**
 * A step in a cycle chain, used for rich cycle diagnostics.
 */
export interface CycleStep {
  /** The request that formed this step */
  readonly request: ResolutionRequest;
  /** The node where this step originates (for source location) */
  readonly target: DiagnosticTarget;
}

/**
 * Result of attempting to start a resolution.
 * If a cycle is detected, `cycle` contains the full chain.
 */
export type ResolutionResult =
  | { readonly status: "ok" }
  | { readonly status: "cycle"; readonly steps: readonly CycleStep[] };

/**
 * A centralized type resolver that provides:
 * - Stack-based cycle detection with full cycle chain visibility
 * - Result caching per (sym, kind) pair
 * - Rich cycle diagnostics showing the complete dependency chain
 *
 * Inspired by Swift's request-based Evaluator architecture.
 *
 * Usage pattern:
 * ```
 * const result = resolver.startResolution(request);
 * if (result.status === "cycle") {
 *   // report cycle diagnostic using result.steps
 *   return errorType;
 * }
 * try {
 *   // ... perform the actual resolution work ...
 * } finally {
 *   resolver.finishResolution(request);
 * }
 * ```
 */
export class TypeResolver {
  /**
   * The active request stack. Uses an array for ordering (cycle chain extraction)
   * and a Set for O(1) membership testing.
   */
  readonly #stack: ResolutionRequest[] = [];
  readonly #stackKeys = new Set<string>();

  /**
   * Cache of completed resolutions.
   * Key: `${sym.id}:${kind}`
   */
  readonly #cache = new Map<string, unknown>();

  /**
   * Generate a unique key for a (sym, kind) pair.
   */
  #key(sym: Sym, kind: ResolutionKind): string {
    return `${sym.id}:${kind}`;
  }

  /**
   * Attempt to begin resolving a request.
   *
   * If the same (sym, kind) is already on the active stack, returns a cycle result
   * containing the full chain of requests that form the cycle.
   *
   * Otherwise, pushes the request onto the stack and returns "ok".
   */
  startResolution(request: ResolutionRequest): ResolutionResult {
    const key = this.#key(request.sym, request.kind);

    // Check if this request is already in progress → cycle
    if (this.#stackKeys.has(key)) {
      return { status: "cycle", steps: this.#extractCycleChain(key, request) };
    }

    // Push onto the stack
    this.#stack.push(request);
    this.#stackKeys.add(key);
    return { status: "ok" };
  }

  /**
   * Mark a resolution as complete. Must be called after startResolution returned "ok".
   */
  finishResolution(request: ResolutionRequest): void {
    const key = this.#key(request.sym, request.kind);
    const top = this.#stack[this.#stack.length - 1];

    // The resolution being finished should be on top of the stack.
    // If not, it means resolutions are not properly nested.
    if (top && this.#key(top.sym, top.kind) === key) {
      this.#stack.pop();
    } else {
      // Non-top finish: find and remove from stack (shouldn't normally happen)
      const idx = this.#stack.findIndex(
        (r) => this.#key(r.sym, r.kind) === key,
      );
      if (idx >= 0) {
        this.#stack.splice(idx, 1);
      }
    }
    this.#stackKeys.delete(key);
  }

  /**
   * Check if a particular (sym, kind) is currently being resolved.
   * Useful for checking dependencies without starting a full resolution.
   */
  isResolving(sym: Sym, kind: ResolutionKind): boolean {
    return this.#stackKeys.has(this.#key(sym, kind));
  }

  /**
   * Get a cached resolution result, if available.
   */
  getCached<T>(sym: Sym, kind: ResolutionKind): T | undefined {
    return this.#cache.get(this.#key(sym, kind)) as T | undefined;
  }

  /**
   * Store a resolution result in the cache.
   */
  setCached<T>(sym: Sym, kind: ResolutionKind, value: T): void {
    this.#cache.set(this.#key(sym, kind), value);
  }

  /**
   * Get the current depth of the resolution stack.
   * Useful for debugging and assertions.
   */
  get depth(): number {
    return this.#stack.length;
  }

  /**
   * Check whether any resolutions are still in progress.
   * Should be empty at end of type checking.
   */
  get hasPendingResolutions(): boolean {
    return this.#stack.length > 0;
  }

  /**
   * Get all pending resolution requests (for debugging/assertions).
   */
  get pendingRequests(): readonly ResolutionRequest[] {
    return this.#stack;
  }

  /**
   * Extract the cycle chain from the stack.
   * Returns the sub-stack from the first occurrence of the cycling key
   * to the current request (inclusive), forming a complete cycle.
   */
  #extractCycleChain(key: string, closingRequest: ResolutionRequest): CycleStep[] {
    const steps: CycleStep[] = [];

    // Find where the cycle starts in the stack
    let cycleStart = -1;
    for (let i = 0; i < this.#stack.length; i++) {
      const req = this.#stack[i];
      if (this.#key(req.sym, req.kind) === key) {
        cycleStart = i;
        break;
      }
    }

    if (cycleStart === -1) {
      // Shouldn't happen since we checked #stackKeys, but be defensive
      return [{ request: closingRequest, target: closingRequest.node }];
    }

    // Collect all steps from the cycle start to end of stack
    for (let i = cycleStart; i < this.#stack.length; i++) {
      steps.push({
        request: this.#stack[i],
        target: this.#stack[i].node,
      });
    }

    // Add the closing request that completes the cycle
    steps.push({
      request: closingRequest,
      target: closingRequest.node,
    });

    return steps;
  }

  /**
   * Format cycle steps into diagnostic notes for rich error reporting.
   * Returns an array of related diagnostic information showing the full cycle chain.
   *
   * Example output when formatted:
   *   note: 'A' extends 'B' here
   *   note: 'B' extends 'C' here
   *   note: 'C' extends 'A' here (cycle closes)
   */
  static formatCycleDiagnostics(steps: readonly CycleStep[]): string[] {
    return steps.map((step, i) => {
      const isLast = i === steps.length - 1;
      const suffix = isLast ? " (cycle closes)" : "";
      return `${step.request.description}${suffix}`;
    });
  }

  /**
   * Track a deferred completion. This records that a type's finalization
   * is waiting for one or more dependencies to finish being created.
   * Used for integration with the ensureResolved/waitingForResolution system.
   */
  trackDeferredCompletion(description: string, dependencyCount: number): void {
    this.#deferredCompletions.push({ description, dependencyCount, resolved: false });
  }

  /**
   * Mark a deferred completion as resolved.
   */
  resolveDeferredCompletion(description: string): void {
    const entry = this.#deferredCompletions.find(
      (d) => d.description === description && !d.resolved,
    );
    if (entry) {
      entry.resolved = true;
    }
  }

  /**
   * Get all unresolved deferred completions (for debugging/assertions).
   */
  get unresolvedDeferredCompletions(): readonly { description: string; dependencyCount: number }[] {
    return this.#deferredCompletions.filter((d) => !d.resolved);
  }

  readonly #deferredCompletions: {
    description: string;
    dependencyCount: number;
    resolved: boolean;
  }[] = [];

  /**
   * Reset the resolver state. Used between compilations or for testing.
   */
  reset(): void {
    this.#stack.length = 0;
    this.#stackKeys.clear();
    this.#cache.clear();
    this.#deferredCompletions.length = 0;
  }
}
