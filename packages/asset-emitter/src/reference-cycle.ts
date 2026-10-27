import { getTypeName, type Type } from "@typespec/compiler";
import type { EmitEntity } from "./types.js";

/** A visited type and its corresponding emit result at the time a reference cycle is resolved. */
export interface ReferenceCycleEntry {
  /** TypeSpec type encountered along the reference path. */
  type: Type;
  /** Cached output for this visit; may be a declaration, inline result, omission, or circular sentinel. */
  entity: EmitEntity<unknown>;
}

/**
 * Represent a reference cycle.
 * The cycle entries will always start with a declaration if there is one in the cycle.
 */
export class ReferenceCycle implements Iterable<ReferenceCycleEntry> {
  /**
   * Whether any entry emits a declaration, allowing the default circular-reference
   * handler to break the cycle with a named reference.
   */
  readonly containsDeclaration: boolean;

  #entries: ReferenceCycleEntry[];

  /**
   * Describe a non-empty chain in reference order. If a declaration is present,
   * rotate the chain to begin at the first declaration, preserving cyclic order.
   */
  constructor(entries: ReferenceCycleEntry[]) {
    const firstDeclarationIndex = entries.findIndex((entry) => entry.entity.kind === "declaration");
    this.containsDeclaration = firstDeclarationIndex !== -1;
    this.#entries = this.containsDeclaration
      ? [...entries.slice(firstDeclarationIndex), ...entries.slice(0, firstDeclarationIndex)]
      : entries;
  }

  /** First entry after rotation: a declaration when the cycle contains one. */
  get first(): ReferenceCycleEntry {
    return this.#entries[0];
  }

  /** Iterate once around the rotated chain without repeating the first entry at the end. */
  [Symbol.iterator](): Iterator<ReferenceCycleEntry> {
    return this.#entries[Symbol.iterator]();
  }

  /** Format TypeSpec type names as an arrow-separated path, repeating the first entry to close the cycle. */
  [Symbol.toStringTag](): string {
    return [...this.#entries, this.#entries[0]].map((x) => getTypeName(x.type)).join(" -> ");
  }

  toString(): string {
    return this[Symbol.toStringTag]();
  }
}
