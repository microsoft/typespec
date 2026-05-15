import { compilerAssert } from "./diagnostics.js";
import type { Node, Sym, Type } from "./types.js";

/**
 * Represents the status of a check item in the queue.
 */
export enum CheckItemStatus {
  /** Not yet attempted */
  Pending = "pending",
  /** Currently being checked (for intra-item cycle detection) */
  InProgress = "in-progress",
  /** Attempted but blocked on unresolved dependencies */
  Deferred = "deferred",
  /** Successfully checked */
  Done = "done",
  /** Failed (circular or other error) */
  Error = "error",
}

/**
 * The result of attempting to check a declaration.
 * Returned by check functions to signal their outcome to the queue.
 */
export type CheckResult<T extends Type = Type> =
  | { readonly status: "done"; readonly type: T }
  | { readonly status: "deferred"; readonly stalledOn: readonly Sym[] }
  | { readonly status: "error" };

export namespace CheckResult {
  /** Create a successful result */
  export function done<T extends Type>(type: T): CheckResult<T> {
    return { status: "done", type };
  }

  /** Create a deferred result, blocked on the given symbols */
  export function deferred(stalledOn: readonly Sym[]): CheckResult<never> {
    return { status: "deferred", stalledOn };
  }

  /** Create an error result */
  export function error(): CheckResult<never> {
    return { status: "error" };
  }
}

/**
 * An item in the check queue representing a top-level declaration to check.
 */
export interface CheckItem {
  /** The symbol for this declaration */
  readonly sym: Sym;

  /** The AST node for this declaration */
  readonly node: Node;

  /** Current status */
  status: CheckItemStatus;

  /** Symbols this item is waiting on (populated when status is Deferred) */
  readonly stalledOn: Set<Sym>;

  /** Items that are waiting for this item to complete */
  readonly dependents: Set<CheckItem>;

  /** Number of times this item has been attempted */
  attempts: number;

  /** Partially-constructed type from a previous attempt (shell created, not yet finished) */
  partialType?: Type;
}

/**
 * Result of processing the queue to fixpoint.
 */
export interface CheckQueueResult {
  /** Items that completed successfully */
  readonly completed: readonly CheckItem[];

  /** Items that errored during checking */
  readonly errored: readonly CheckItem[];

  /**
   * Items that could not be resolved (true circular dependencies).
   * Grouped into strongly connected components for cycle reporting.
   */
  readonly cycles: readonly (readonly CheckItem[])[];
}

/**
 * A worklist-based queue for type checking declarations.
 *
 * Declarations are registered, then processed in rounds. If a declaration
 * cannot be checked because a dependency hasn't been checked yet, it is
 * deferred. Processing continues until no more progress can be made (fixpoint).
 * Remaining items form circular dependency cycles.
 */
export class CheckQueue {
  /** All registered items, keyed by symbol */
  readonly #items = new Map<Sym, CheckItem>();

  /** Items ready to be processed (FIFO — preserves source order) */
  readonly #ready: CheckItem[] = [];
  #readyIndex = 0;

  /**
   * Register a declaration to be checked.
   * @returns The created CheckItem
   */
  register(sym: Sym, node: Node): CheckItem {
    const existing = this.#items.get(sym);
    if (existing) {
      return existing;
    }

    const item: CheckItem = {
      sym,
      node,
      status: CheckItemStatus.Pending,
      stalledOn: new Set(),
      dependents: new Set(),
      attempts: 0,
    };

    this.#items.set(sym, item);
    this.#ready.push(item);
    return item;
  }

  /**
   * Look up the check item for a symbol, if registered.
   */
  get(sym: Sym): CheckItem | undefined {
    return this.#items.get(sym);
  }

  /**
   * Check whether a symbol has been registered and is done.
   */
  isDone(sym: Sym): boolean {
    const item = this.#items.get(sym);
    return item !== undefined && item.status === CheckItemStatus.Done;
  }

  /**
   * Check whether a symbol is registered but not yet done.
   */
  isPending(sym: Sym): boolean {
    const item = this.#items.get(sym);
    if (item === undefined) return false;
    return (
      item.status === CheckItemStatus.Pending || item.status === CheckItemStatus.Deferred
    );
  }

  /**
   * Get the next ready item, or undefined if none are ready.
   */
  dequeue(): CheckItem | undefined {
    while (this.#readyIndex < this.#ready.length) {
      const item = this.#ready[this.#readyIndex++];
      // Skip items that were already processed (e.g. by demand-driven resolution)
      if (item.status === CheckItemStatus.Pending || item.status === CheckItemStatus.Deferred) {
        return item;
      }
    }
    return undefined;
  }

  /**
   * Mark an item as successfully checked.
   * Notifies all dependents and moves newly-unblocked dependents to the ready queue.
   */
  markDone(item: CheckItem): void {
    compilerAssert(
      item.status === CheckItemStatus.InProgress,
      `Cannot mark item as done: status is '${item.status}', expected 'in-progress'`,
    );

    item.status = CheckItemStatus.Done;
    item.stalledOn.clear();

    // Notify all dependents
    for (const dependent of item.dependents) {
      dependent.stalledOn.delete(item.sym);
      if (dependent.stalledOn.size === 0 && dependent.status === CheckItemStatus.Deferred) {
        // All dependencies resolved — this dependent is ready to retry
        dependent.status = CheckItemStatus.Pending;
        this.#ready.push(dependent);
      }
    }
    item.dependents.clear();
  }

  /**
   * Mark an item as deferred because it's blocked on the given symbols.
   * Registers dependency edges so the item is notified when blockers complete.
   */
  markDeferred(item: CheckItem, stalledOn: readonly Sym[]): void {
    compilerAssert(
      item.status === CheckItemStatus.InProgress,
      `Cannot defer item: status is '${item.status}', expected 'in-progress'`,
    );
    compilerAssert(stalledOn.length > 0, "Cannot defer with empty stalledOn list");

    item.status = CheckItemStatus.Deferred;
    item.stalledOn.clear();

    for (const depSym of stalledOn) {
      const depItem = this.#items.get(depSym);
      if (depItem && depItem.status !== CheckItemStatus.Done) {
        item.stalledOn.add(depSym);
        depItem.dependents.add(item);
      }
      // If the dependency is already done or not in the queue, don't stall on it
    }

    // If all dependencies were actually already resolved, re-queue immediately
    if (item.stalledOn.size === 0) {
      item.status = CheckItemStatus.Pending;
      this.#ready.push(item);
    }
  }

  /**
   * Mark an item as errored.
   */
  markError(item: CheckItem): void {
    compilerAssert(
      item.status === CheckItemStatus.InProgress,
      `Cannot mark item as error: status is '${item.status}', expected 'in-progress'`,
    );
    item.status = CheckItemStatus.Error;
    item.stalledOn.clear();

    // Notify dependents so they can retry (they'll discover the error type)
    for (const dependent of item.dependents) {
      dependent.stalledOn.delete(item.sym);
      if (dependent.stalledOn.size === 0 && dependent.status === CheckItemStatus.Deferred) {
        dependent.status = CheckItemStatus.Pending;
        this.#ready.push(dependent);
      }
    }
    item.dependents.clear();
  }

  /**
   * Mark an item as in-progress (being actively checked).
   */
  markInProgress(item: CheckItem): void {
    compilerAssert(
      item.status === CheckItemStatus.Pending || item.status === CheckItemStatus.Deferred,
      `Cannot mark item as in-progress: status is '${item.status}', expected 'pending' or 'deferred'`,
    );
    item.status = CheckItemStatus.InProgress;
    item.attempts++;
  }

  /**
   * Process the queue until fixpoint using a checker callback.
   *
   * The callback receives a CheckItem and should attempt to check it.
   * It must call markDone, markDeferred, or markError on the item before returning.
   *
   * @returns Result containing completed items, errored items, and cycle groups
   */
  processUntilFixpoint(check: (item: CheckItem) => void): CheckQueueResult {
    const completed: CheckItem[] = [];
    const errored: CheckItem[] = [];

    // Process ready items until none remain
    let item: CheckItem | undefined;
    while ((item = this.dequeue()) !== undefined) {
      this.markInProgress(item);
      check(item);

      if (item.status === CheckItemStatus.Done) {
        completed.push(item);
      } else if (item.status === CheckItemStatus.Error) {
        errored.push(item);
      }
      // Deferred items will be re-queued when their dependencies complete
    }

    // Anything still deferred at this point is part of a circular dependency
    const cycles = this.#detectCycles();

    return { completed, errored, cycles };
  }

  /**
   * Detect strongly connected components among remaining deferred items.
   * Uses Tarjan's algorithm on the stalledOn dependency graph.
   */
  #detectCycles(): (readonly CheckItem[])[] {
    const deferred: CheckItem[] = [];
    for (const item of this.#items.values()) {
      if (item.status === CheckItemStatus.Deferred) {
        deferred.push(item);
      }
    }

    if (deferred.length === 0) {
      return [];
    }

    // Tarjan's SCC algorithm
    let index = 0;
    const stack: CheckItem[] = [];
    const onStack = new Set<CheckItem>();
    const indices = new Map<CheckItem, number>();
    const lowlinks = new Map<CheckItem, number>();
    const sccs: CheckItem[][] = [];

    const deferredSet = new Set(deferred);

    const strongConnect = (item: CheckItem) => {
      indices.set(item, index);
      lowlinks.set(item, index);
      index++;
      stack.push(item);
      onStack.add(item);

      // Visit successors (items this one depends on that are also deferred)
      for (const depSym of item.stalledOn) {
        const depItem = this.#items.get(depSym);
        if (!depItem || !deferredSet.has(depItem)) continue;

        if (!indices.has(depItem)) {
          strongConnect(depItem);
          lowlinks.set(item, Math.min(lowlinks.get(item)!, lowlinks.get(depItem)!));
        } else if (onStack.has(depItem)) {
          lowlinks.set(item, Math.min(lowlinks.get(item)!, indices.get(depItem)!));
        }
      }

      // If item is a root node, pop the SCC
      if (lowlinks.get(item) === indices.get(item)) {
        const scc: CheckItem[] = [];
        let w: CheckItem;
        do {
          w = stack.pop()!;
          onStack.delete(w);
          scc.push(w);
        } while (w !== item);

        sccs.push(scc);
      }
    };

    for (const item of deferred) {
      if (!indices.has(item)) {
        strongConnect(item);
      }
    }

    return sccs;
  }

  /**
   * Get all items in the queue (for debugging/diagnostics).
   */
  get size(): number {
    return this.#items.size;
  }

  /**
   * Get all items (for debugging).
   */
  [Symbol.iterator](): IterableIterator<CheckItem> {
    return this.#items.values();
  }
}
