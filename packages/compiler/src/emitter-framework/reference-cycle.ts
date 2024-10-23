import { getTypeName } from "../core/helpers/type-name-utils.js";
import type { Type } from "../core/index.js";
import type { EmitEntity } from "./types.js";

export interface ReferenceCycleEntry {
  type: Type;
  entity: EmitEntity<unknown>;
}

/**
 * Represent a reference cycle.
 * The cycle entries will always start with a declaration if there is one in the cycle.
 */
export class ReferenceCycle implements Iterable<ReferenceCycleEntry> {
  /**
   * If this cycle contains a declaration.
   */
  readonly containsDeclaration: boolean;

  #entries: ReferenceCycleEntry[];

  constructor(entries: ReferenceCycleEntry[]) {
    const firstDeclarationIndex = entries.findIndex((entry) => entry.entity.kind === "declaration");
    this.containsDeclaration = firstDeclarationIndex !== -1;
    this.#entries = this.containsDeclaration
      ? [...entries.slice(firstDeclarationIndex), ...entries.slice(0, firstDeclarationIndex)]
      : entries;
  }

  get first(): ReferenceCycleEntry {
    return this.#entries[0];
  }

  [Symbol.iterator](): Iterator<ReferenceCycleEntry> {
    return this.#entries[Symbol.iterator]();
  }

  [Symbol.toStringTag](): string {
    return [...this.#entries, this.#entries[0]].map((x) => getTypeName(x.type)).join(" -> ");
  }

  toString(): string {
    return this[Symbol.toStringTag]();
  }
}
