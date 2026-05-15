import { describe, expect, it } from "vitest";
import {
  CheckItemStatus,
  CheckQueue,
  CheckResult,
  type CheckItem,
} from "../../src/core/check-queue.js";
import type { Node, Sym } from "../../src/core/types.js";

/** Create a minimal mock Sym for testing */
function createMockSym(name: string): Sym {
  return {
    flags: 0,
    declarations: [],
    node: {} as Node,
    name,
    id: Math.random(),
  } as unknown as Sym;
}

/** Create a minimal mock Node for testing */
function createMockNode(): Node {
  return {} as Node;
}

describe("CheckQueue", () => {
  describe("register", () => {
    it("creates a pending item", () => {
      const queue = new CheckQueue();
      const sym = createMockSym("A");
      const node = createMockNode();

      const item = queue.register(sym, node);

      expect(item.status).toBe(CheckItemStatus.Pending);
      expect(item.sym).toBe(sym);
      expect(item.node).toBe(node);
      expect(item.attempts).toBe(0);
      expect(item.stalledOn.size).toBe(0);
      expect(item.dependents.size).toBe(0);
    });

    it("returns existing item on duplicate registration", () => {
      const queue = new CheckQueue();
      const sym = createMockSym("A");
      const node = createMockNode();

      const item1 = queue.register(sym, node);
      const item2 = queue.register(sym, createMockNode());

      expect(item1).toBe(item2);
    });
  });

  describe("dequeue", () => {
    it("returns registered items", () => {
      const queue = new CheckQueue();
      const sym = createMockSym("A");
      queue.register(sym, createMockNode());

      const item = queue.dequeue();

      expect(item).toBeDefined();
      expect(item!.sym).toBe(sym);
    });

    it("returns undefined when empty", () => {
      const queue = new CheckQueue();
      expect(queue.dequeue()).toBeUndefined();
    });

    it("skips items that are already done", () => {
      const queue = new CheckQueue();
      const sym = createMockSym("A");
      const item = queue.register(sym, createMockNode());
      queue.markInProgress(item);
      queue.markDone(item);

      expect(queue.dequeue()).toBeUndefined();
    });
  });

  describe("markDone", () => {
    it("sets status to Done", () => {
      const queue = new CheckQueue();
      const sym = createMockSym("A");
      const item = queue.register(sym, createMockNode());
      queue.markInProgress(item);
      queue.markDone(item);

      expect(item.status).toBe(CheckItemStatus.Done);
    });

    it("notifies dependents and unblocks them", () => {
      const queue = new CheckQueue();
      const symA = createMockSym("A");
      const symB = createMockSym("B");
      const itemA = queue.register(symA, createMockNode());
      const itemB = queue.register(symB, createMockNode());

      // B depends on A
      queue.markInProgress(itemB);
      queue.markDeferred(itemB, [symA]);
      expect(itemB.status).toBe(CheckItemStatus.Deferred);

      // Complete A
      queue.markInProgress(itemA);
      queue.markDone(itemA);

      // B should now be re-queued as pending
      expect(itemB.status).toBe(CheckItemStatus.Pending);
      const next = queue.dequeue();
      expect(next).toBe(itemB);
    });

    it("doesn't unblock dependents that have other pending deps", () => {
      const queue = new CheckQueue();
      const symA = createMockSym("A");
      const symB = createMockSym("B");
      const symC = createMockSym("C");

      queue.register(symA, createMockNode());
      queue.register(symB, createMockNode());
      queue.register(symC, createMockNode());

      const checked: string[] = [];
      const result = queue.processUntilFixpoint((item) => {
        if (item.sym.name === "C" && !queue.isDone(symA)) {
          // C depends on both A and B
          queue.markDeferred(item, [symA, symB]);
          return;
        }
        if (item.sym.name === "C" && !queue.isDone(symB)) {
          // After A is done, C still needs B
          queue.markDeferred(item, [symB]);
          return;
        }
        checked.push(item.sym.name);
        queue.markDone(item);
      });

      expect(result.completed).toHaveLength(3);
      // C should be checked last (after both A and B)
      expect(checked.indexOf("C")).toBe(2);
    });
  });

  describe("markDeferred", () => {
    it("sets status to Deferred with stalledOn", () => {
      const queue = new CheckQueue();
      const symA = createMockSym("A");
      const symB = createMockSym("B");
      queue.register(symA, createMockNode());
      const itemB = queue.register(symB, createMockNode());

      queue.dequeue(); // A
      queue.dequeue(); // B
      queue.markInProgress(itemB);
      queue.markDeferred(itemB, [symA]);

      expect(itemB.status).toBe(CheckItemStatus.Deferred);
      expect(itemB.stalledOn.has(symA)).toBe(true);
    });

    it("re-queues immediately if all deps are already done", () => {
      const queue = new CheckQueue();
      const symA = createMockSym("A");
      const symB = createMockSym("B");
      const itemA = queue.register(symA, createMockNode());
      const itemB = queue.register(symB, createMockNode());

      // Complete A first
      queue.dequeue(); // A
      queue.markInProgress(itemA);
      queue.markDone(itemA);

      // B tries to defer on A, but A is already done
      queue.dequeue(); // B
      queue.markInProgress(itemB);
      queue.markDeferred(itemB, [symA]);

      // B should be re-queued immediately
      expect(itemB.status).toBe(CheckItemStatus.Pending);
      expect(queue.dequeue()).toBe(itemB);
    });
  });

  describe("markError", () => {
    it("sets status to Error", () => {
      const queue = new CheckQueue();
      const sym = createMockSym("A");
      const item = queue.register(sym, createMockNode());
      queue.markInProgress(item);
      queue.markError(item);

      expect(item.status).toBe(CheckItemStatus.Error);
    });

    it("unblocks dependents on error", () => {
      const queue = new CheckQueue();
      const symA = createMockSym("A");
      const symB = createMockSym("B");
      const itemA = queue.register(symA, createMockNode());
      const itemB = queue.register(symB, createMockNode());

      // B depends on A
      queue.dequeue(); // A
      queue.dequeue(); // B
      queue.markInProgress(itemB);
      queue.markDeferred(itemB, [symA]);

      // A errors
      queue.markInProgress(itemA);
      queue.markError(itemA);

      // B should be unblocked
      expect(itemB.status).toBe(CheckItemStatus.Pending);
    });
  });

  describe("isDone / isPending", () => {
    it("isDone returns true for completed items", () => {
      const queue = new CheckQueue();
      const sym = createMockSym("A");
      const item = queue.register(sym, createMockNode());
      queue.markInProgress(item);
      queue.markDone(item);

      expect(queue.isDone(sym)).toBe(true);
      expect(queue.isPending(sym)).toBe(false);
    });

    it("isPending returns true for pending/deferred items", () => {
      const queue = new CheckQueue();
      const sym = createMockSym("A");
      queue.register(sym, createMockNode());

      expect(queue.isPending(sym)).toBe(true);
      expect(queue.isDone(sym)).toBe(false);
    });

    it("returns false for unregistered symbols", () => {
      const queue = new CheckQueue();
      const sym = createMockSym("A");

      expect(queue.isDone(sym)).toBe(false);
      expect(queue.isPending(sym)).toBe(false);
    });
  });

  describe("processUntilFixpoint", () => {
    it("processes all items when there are no dependencies", () => {
      const queue = new CheckQueue();
      const syms = ["A", "B", "C"].map((n) => createMockSym(n));
      for (const sym of syms) {
        queue.register(sym, createMockNode());
      }

      const checked: string[] = [];
      const result = queue.processUntilFixpoint((item) => {
        checked.push(item.sym.name);
        queue.markDone(item);
      });

      expect(checked).toHaveLength(3);
      expect(result.completed).toHaveLength(3);
      expect(result.errored).toHaveLength(0);
      expect(result.cycles).toHaveLength(0);
    });

    it("handles linear dependency chain", () => {
      const queue = new CheckQueue();
      const symA = createMockSym("A");
      const symB = createMockSym("B");
      const symC = createMockSym("C");
      queue.register(symA, createMockNode());
      queue.register(symB, createMockNode());
      queue.register(symC, createMockNode());

      const checked: string[] = [];
      const result = queue.processUntilFixpoint((item) => {
        // C depends on B, B depends on A
        if (item.sym.name === "C" && !queue.isDone(symB)) {
          queue.markDeferred(item, [symB]);
          return;
        }
        if (item.sym.name === "B" && !queue.isDone(symA)) {
          queue.markDeferred(item, [symA]);
          return;
        }
        checked.push(item.sym.name);
        queue.markDone(item);
      });

      // Should resolve: A first, then B, then C
      expect(checked).toEqual(expect.arrayContaining(["A", "B", "C"]));
      expect(checked.indexOf("A")).toBeLessThan(checked.indexOf("B"));
      expect(checked.indexOf("B")).toBeLessThan(checked.indexOf("C"));
      expect(result.completed).toHaveLength(3);
      expect(result.cycles).toHaveLength(0);
    });

    it("detects circular dependencies", () => {
      const queue = new CheckQueue();
      const symA = createMockSym("A");
      const symB = createMockSym("B");
      queue.register(symA, createMockNode());
      queue.register(symB, createMockNode());

      const result = queue.processUntilFixpoint((item) => {
        // A depends on B, B depends on A — true cycle
        if (item.sym.name === "A") {
          queue.markDeferred(item, [symB]);
        } else {
          queue.markDeferred(item, [symA]);
        }
      });

      expect(result.completed).toHaveLength(0);
      expect(result.cycles.length).toBeGreaterThan(0);
      // Both A and B should be in a single SCC
      const allCycleItems = result.cycles.flat();
      expect(allCycleItems).toHaveLength(2);
    });

    it("detects multiple independent cycles", () => {
      const queue = new CheckQueue();
      const symA = createMockSym("A");
      const symB = createMockSym("B");
      const symC = createMockSym("C");
      const symD = createMockSym("D");
      queue.register(symA, createMockNode());
      queue.register(symB, createMockNode());
      queue.register(symC, createMockNode());
      queue.register(symD, createMockNode());

      const result = queue.processUntilFixpoint((item) => {
        // Cycle 1: A <-> B
        // Cycle 2: C <-> D
        switch (item.sym.name) {
          case "A":
            queue.markDeferred(item, [symB]);
            break;
          case "B":
            queue.markDeferred(item, [symA]);
            break;
          case "C":
            queue.markDeferred(item, [symD]);
            break;
          case "D":
            queue.markDeferred(item, [symC]);
            break;
        }
      });

      expect(result.completed).toHaveLength(0);
      // Should detect 2 separate SCCs
      const twoItemSCCs = result.cycles.filter((scc) => scc.length === 2);
      expect(twoItemSCCs).toHaveLength(2);
    });

    it("handles mixed: some items resolve, some form cycles", () => {
      const queue = new CheckQueue();
      const symA = createMockSym("A");
      const symB = createMockSym("B");
      const symC = createMockSym("C");
      queue.register(symA, createMockNode());
      queue.register(symB, createMockNode());
      queue.register(symC, createMockNode());

      const result = queue.processUntilFixpoint((item) => {
        if (item.sym.name === "A") {
          // A resolves fine
          queue.markDone(item);
        } else if (item.sym.name === "B") {
          // B depends on C
          queue.markDeferred(item, [symC]);
        } else {
          // C depends on B — cycle
          queue.markDeferred(item, [symB]);
        }
      });

      expect(result.completed).toHaveLength(1);
      expect(result.completed[0].sym.name).toBe("A");
      expect(result.cycles.length).toBeGreaterThan(0);
    });

    it("handles items that defer then resolve on retry", () => {
      const queue = new CheckQueue();
      const symA = createMockSym("A");
      const symB = createMockSym("B");
      queue.register(symA, createMockNode());
      queue.register(symB, createMockNode());

      const result = queue.processUntilFixpoint((item) => {
        if (item.sym.name === "B" && !queue.isDone(symA)) {
          // B defers on first attempt, but A will resolve
          queue.markDeferred(item, [symA]);
          return;
        }
        queue.markDone(item);
      });

      expect(result.completed).toHaveLength(2);
      expect(result.cycles).toHaveLength(0);
    });

    it("tracks attempt count", () => {
      const queue = new CheckQueue();
      const symA = createMockSym("A");
      const symB = createMockSym("B");
      queue.register(symA, createMockNode());
      const itemB = queue.register(symB, createMockNode());

      queue.processUntilFixpoint((item) => {
        if (item.sym.name === "B" && item.attempts === 1) {
          queue.markDeferred(item, [symA]);
          return;
        }
        queue.markDone(item);
      });

      expect(itemB.attempts).toBe(2);
    });

    it("handles errors during checking", () => {
      const queue = new CheckQueue();
      const sym = createMockSym("A");
      queue.register(sym, createMockNode());

      const result = queue.processUntilFixpoint((item) => {
        queue.markError(item);
      });

      expect(result.errored).toHaveLength(1);
      expect(result.completed).toHaveLength(0);
    });
  });

  describe("CheckResult helpers", () => {
    it("creates done result", () => {
      const type = { kind: "Model" } as any;
      const result = CheckResult.done(type);
      expect(result.status).toBe("done");
      expect((result as any).type).toBe(type);
    });

    it("creates deferred result", () => {
      const sym = createMockSym("A");
      const result = CheckResult.deferred([sym]);
      expect(result.status).toBe("deferred");
      expect((result as any).stalledOn).toEqual([sym]);
    });

    it("creates error result", () => {
      const result = CheckResult.error();
      expect(result.status).toBe("error");
    });
  });

  describe("size", () => {
    it("reports correct size", () => {
      const queue = new CheckQueue();
      expect(queue.size).toBe(0);

      queue.register(createMockSym("A"), createMockNode());
      expect(queue.size).toBe(1);

      queue.register(createMockSym("B"), createMockNode());
      expect(queue.size).toBe(2);
    });
  });
});
