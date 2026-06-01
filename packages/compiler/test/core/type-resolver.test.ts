import { describe, expect, it } from "vitest";
import {
  CycleStep,
  ResolutionKind,
  ResolutionRequest,
  TypeResolver,
} from "../../src/core/type-resolver.js";
import type { Sym } from "../../src/core/types.js";

/** Create a minimal mock Sym for testing */
function createMockSym(id: number, name: string = `sym${id}`): Sym {
  return {
    flags: 0,
    declarations: [],
    node: {} as any,
    name,
    id,
  } as unknown as Sym;
}

/** Create a resolution request for testing */
function createRequest(
  sym: Sym,
  kind: ResolutionKind,
  description?: string,
): ResolutionRequest {
  return {
    kind,
    sym,
    node: sym.node ?? ({} as any),
    description: description ?? `${kind} of '${sym.name}'`,
  };
}

describe("TypeResolver", () => {
  describe("startResolution / finishResolution", () => {
    it("returns ok for a new resolution", () => {
      const resolver = new TypeResolver();
      const sym = createMockSym(1);
      const req = createRequest(sym, ResolutionKind.BaseType);

      const result = resolver.startResolution(req);
      expect(result.status).toBe("ok");

      resolver.finishResolution(req);
    });

    it("returns ok for different kinds on the same symbol", () => {
      const resolver = new TypeResolver();
      const sym = createMockSym(1);
      const req1 = createRequest(sym, ResolutionKind.BaseType);
      const req2 = createRequest(sym, ResolutionKind.Constraint);

      const result1 = resolver.startResolution(req1);
      expect(result1.status).toBe("ok");

      const result2 = resolver.startResolution(req2);
      expect(result2.status).toBe("ok");

      resolver.finishResolution(req2);
      resolver.finishResolution(req1);
    });

    it("returns ok for the same kind on different symbols", () => {
      const resolver = new TypeResolver();
      const sym1 = createMockSym(1);
      const sym2 = createMockSym(2);
      const req1 = createRequest(sym1, ResolutionKind.BaseType);
      const req2 = createRequest(sym2, ResolutionKind.BaseType);

      const result1 = resolver.startResolution(req1);
      expect(result1.status).toBe("ok");

      const result2 = resolver.startResolution(req2);
      expect(result2.status).toBe("ok");

      resolver.finishResolution(req2);
      resolver.finishResolution(req1);
    });

    it("finishResolution removes from stack", () => {
      const resolver = new TypeResolver();
      const sym = createMockSym(1);
      const req = createRequest(sym, ResolutionKind.BaseType);

      resolver.startResolution(req);
      expect(resolver.depth).toBe(1);

      resolver.finishResolution(req);
      expect(resolver.depth).toBe(0);

      // Can start the same resolution again after finishing
      const result = resolver.startResolution(req);
      expect(result.status).toBe("ok");
      resolver.finishResolution(req);
    });
  });

  describe("cycle detection", () => {
    it("detects direct self-cycle", () => {
      const resolver = new TypeResolver();
      const sym = createMockSym(1, "A");
      const req = createRequest(sym, ResolutionKind.BaseType);

      const result1 = resolver.startResolution(req);
      expect(result1.status).toBe("ok");

      // Attempting to resolve the same (sym, kind) again → cycle
      const result2 = resolver.startResolution(req);
      expect(result2.status).toBe("cycle");

      resolver.finishResolution(req);
    });

    it("detects indirect cycle (A → B → A)", () => {
      const resolver = new TypeResolver();
      const symA = createMockSym(1, "A");
      const symB = createMockSym(2, "B");
      const reqA = createRequest(symA, ResolutionKind.BaseType, "Model 'A'");
      const reqB = createRequest(symB, ResolutionKind.BaseType, "Model 'B'");

      resolver.startResolution(reqA);
      resolver.startResolution(reqB);

      // B tries to resolve A's base type → cycle
      const result = resolver.startResolution(reqA);
      expect(result.status).toBe("cycle");

      resolver.finishResolution(reqB);
      resolver.finishResolution(reqA);
    });

    it("detects longer cycle chains (A → B → C → A)", () => {
      const resolver = new TypeResolver();
      const symA = createMockSym(1, "A");
      const symB = createMockSym(2, "B");
      const symC = createMockSym(3, "C");
      const reqA = createRequest(symA, ResolutionKind.BaseType, "Model 'A'");
      const reqB = createRequest(symB, ResolutionKind.BaseType, "Model 'B'");
      const reqC = createRequest(symC, ResolutionKind.BaseType, "Model 'C'");

      resolver.startResolution(reqA);
      resolver.startResolution(reqB);
      resolver.startResolution(reqC);

      // C tries to resolve A's base type → cycle
      const result = resolver.startResolution(reqA);
      expect(result.status).toBe("cycle");
      if (result.status === "cycle") {
        // Chain should be: A, B, C, A (closing)
        expect(result.steps).toHaveLength(4);
        expect(result.steps[0].request.description).toBe("Model 'A'");
        expect(result.steps[1].request.description).toBe("Model 'B'");
        expect(result.steps[2].request.description).toBe("Model 'C'");
        expect(result.steps[3].request.description).toBe("Model 'A'");
      }

      resolver.finishResolution(reqC);
      resolver.finishResolution(reqB);
      resolver.finishResolution(reqA);
    });

    it("does not detect cycle across different resolution kinds", () => {
      const resolver = new TypeResolver();
      const sym = createMockSym(1, "A");
      const reqBase = createRequest(sym, ResolutionKind.BaseType);
      const reqConstraint = createRequest(sym, ResolutionKind.Constraint);

      resolver.startResolution(reqBase);

      // Same symbol, different kind → not a cycle
      const result = resolver.startResolution(reqConstraint);
      expect(result.status).toBe("ok");

      resolver.finishResolution(reqConstraint);
      resolver.finishResolution(reqBase);
    });

    it("cycle detection works after a previous resolution completed", () => {
      const resolver = new TypeResolver();
      const symA = createMockSym(1, "A");
      const symB = createMockSym(2, "B");
      const reqA = createRequest(symA, ResolutionKind.BaseType);
      const reqB = createRequest(symB, ResolutionKind.BaseType);

      // Complete A's resolution normally
      resolver.startResolution(reqA);
      resolver.finishResolution(reqA);

      // Now start B, which tries A again — should NOT be a cycle since A is finished
      resolver.startResolution(reqB);
      const result = resolver.startResolution(reqA);
      expect(result.status).toBe("ok");

      resolver.finishResolution(reqA);
      resolver.finishResolution(reqB);
    });
  });

  describe("isResolving", () => {
    it("returns false when nothing is being resolved", () => {
      const resolver = new TypeResolver();
      const sym = createMockSym(1);
      expect(resolver.isResolving(sym, ResolutionKind.BaseType)).toBe(false);
    });

    it("returns true when a resolution is in progress", () => {
      const resolver = new TypeResolver();
      const sym = createMockSym(1);
      const req = createRequest(sym, ResolutionKind.BaseType);

      resolver.startResolution(req);
      expect(resolver.isResolving(sym, ResolutionKind.BaseType)).toBe(true);

      resolver.finishResolution(req);
      expect(resolver.isResolving(sym, ResolutionKind.BaseType)).toBe(false);
    });

    it("returns false for different kind", () => {
      const resolver = new TypeResolver();
      const sym = createMockSym(1);
      const req = createRequest(sym, ResolutionKind.BaseType);

      resolver.startResolution(req);
      expect(resolver.isResolving(sym, ResolutionKind.Constraint)).toBe(false);

      resolver.finishResolution(req);
    });
  });

  describe("caching", () => {
    it("getCached returns undefined when no cache exists", () => {
      const resolver = new TypeResolver();
      const sym = createMockSym(1);
      expect(resolver.getCached(sym, ResolutionKind.BaseType)).toBeUndefined();
    });

    it("getCached returns cached value after setCached", () => {
      const resolver = new TypeResolver();
      const sym = createMockSym(1);
      const value = { kind: "Model", name: "Foo" };

      resolver.setCached(sym, ResolutionKind.BaseType, value);
      expect(resolver.getCached(sym, ResolutionKind.BaseType)).toBe(value);
    });

    it("different kinds have independent caches", () => {
      const resolver = new TypeResolver();
      const sym = createMockSym(1);
      const value1 = { kind: "base" };
      const value2 = { kind: "constraint" };

      resolver.setCached(sym, ResolutionKind.BaseType, value1);
      resolver.setCached(sym, ResolutionKind.Constraint, value2);

      expect(resolver.getCached(sym, ResolutionKind.BaseType)).toBe(value1);
      expect(resolver.getCached(sym, ResolutionKind.Constraint)).toBe(value2);
    });
  });

  describe("depth and hasPendingResolutions", () => {
    it("starts at depth 0 with no pending", () => {
      const resolver = new TypeResolver();
      expect(resolver.depth).toBe(0);
      expect(resolver.hasPendingResolutions).toBe(false);
    });

    it("tracks depth correctly through nested resolutions", () => {
      const resolver = new TypeResolver();
      const sym1 = createMockSym(1);
      const sym2 = createMockSym(2);
      const req1 = createRequest(sym1, ResolutionKind.BaseType);
      const req2 = createRequest(sym2, ResolutionKind.BaseType);

      resolver.startResolution(req1);
      expect(resolver.depth).toBe(1);
      expect(resolver.hasPendingResolutions).toBe(true);

      resolver.startResolution(req2);
      expect(resolver.depth).toBe(2);

      resolver.finishResolution(req2);
      expect(resolver.depth).toBe(1);

      resolver.finishResolution(req1);
      expect(resolver.depth).toBe(0);
      expect(resolver.hasPendingResolutions).toBe(false);
    });
  });

  describe("pendingRequests", () => {
    it("returns current stack contents", () => {
      const resolver = new TypeResolver();
      const sym1 = createMockSym(1, "A");
      const sym2 = createMockSym(2, "B");
      const req1 = createRequest(sym1, ResolutionKind.BaseType, "Model 'A'");
      const req2 = createRequest(sym2, ResolutionKind.AliasTarget, "Alias 'B'");

      resolver.startResolution(req1);
      resolver.startResolution(req2);

      const pending = resolver.pendingRequests;
      expect(pending).toHaveLength(2);
      expect(pending[0].description).toBe("Model 'A'");
      expect(pending[1].description).toBe("Alias 'B'");

      resolver.finishResolution(req2);
      resolver.finishResolution(req1);
    });
  });

  describe("formatCycleDiagnostics", () => {
    it("formats cycle steps into readable messages", () => {
      const steps: CycleStep[] = [
        { request: { description: "Model 'A' extends 'B'" } as any, target: {} as any },
        { request: { description: "Model 'B' extends 'C'" } as any, target: {} as any },
        { request: { description: "Model 'C' extends 'A'" } as any, target: {} as any },
      ];

      const messages = TypeResolver.formatCycleDiagnostics(steps);
      expect(messages).toHaveLength(3);
      expect(messages[0]).toBe("Model 'A' extends 'B'");
      expect(messages[1]).toBe("Model 'B' extends 'C'");
      expect(messages[2]).toBe("Model 'C' extends 'A' (cycle closes)");
    });
  });

  describe("reset", () => {
    it("clears all state", () => {
      const resolver = new TypeResolver();
      const sym = createMockSym(1);
      const req = createRequest(sym, ResolutionKind.BaseType);

      resolver.startResolution(req);
      resolver.setCached(sym, ResolutionKind.BaseType, { value: "test" });

      resolver.reset();

      expect(resolver.depth).toBe(0);
      expect(resolver.hasPendingResolutions).toBe(false);
      expect(resolver.getCached(sym, ResolutionKind.BaseType)).toBeUndefined();
      expect(resolver.isResolving(sym, ResolutionKind.BaseType)).toBe(false);
    });

    it("clears deferred completions", () => {
      const resolver = new TypeResolver();
      resolver.trackDeferredCompletion("Model 'A'", 2);
      expect(resolver.unresolvedDeferredCompletions).toHaveLength(1);

      resolver.reset();
      expect(resolver.unresolvedDeferredCompletions).toHaveLength(0);
    });
  });

  describe("deferred completions", () => {
    it("tracks deferred completions", () => {
      const resolver = new TypeResolver();
      resolver.trackDeferredCompletion("Model 'A'", 2);
      resolver.trackDeferredCompletion("Model 'B'", 1);

      expect(resolver.unresolvedDeferredCompletions).toHaveLength(2);
      expect(resolver.unresolvedDeferredCompletions[0]).toMatchObject({
        description: "Model 'A'",
        dependencyCount: 2,
      });
    });

    it("resolves deferred completions", () => {
      const resolver = new TypeResolver();
      resolver.trackDeferredCompletion("Model 'A'", 2);
      resolver.trackDeferredCompletion("Model 'B'", 1);

      resolver.resolveDeferredCompletion("Model 'A'");

      expect(resolver.unresolvedDeferredCompletions).toHaveLength(1);
      expect(resolver.unresolvedDeferredCompletions[0].description).toBe("Model 'B'");
    });

    it("resolving non-existent completion is a no-op", () => {
      const resolver = new TypeResolver();
      resolver.trackDeferredCompletion("Model 'A'", 1);
      resolver.resolveDeferredCompletion("Model 'X'");
      expect(resolver.unresolvedDeferredCompletions).toHaveLength(1);
    });
  });
});
