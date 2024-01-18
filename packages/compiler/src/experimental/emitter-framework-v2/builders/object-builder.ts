import { compilerAssert } from "../../../core/index.js";
import { Placeholder } from "../placeholder.js";
import { EmitEntity, EmitterResult } from "../types.js";

// eslint is confused by merging generic interface and classes
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ObjectBuilder<T> extends Record<string, any> {}
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class ObjectBuilder<T> {
  constructor(initializer: Record<string, unknown> | Placeholder<Record<string, unknown>> = {}) {
    if (initializer instanceof Placeholder) {
      initializer.onValue((v) => {
        for (const [key, value] of Object.entries(v)) {
          this.set(key, value as any);
        }
      });
    } else {
      for (const [key, value] of Object.entries(initializer)) {
        this.set(key, value as any);
      }
    }
  }

  set(key: string, v: EmitEntity<T> | Placeholder<T> | T) {
    let value = v;
    if (v instanceof EmitterResult) {
      compilerAssert(v.kind !== "circular", "Can't set a circular emit result.");

      if (v.kind === "none") {
        this[key] = undefined;
        return;
      } else {
        value = v.value;
      }
    }

    if (value instanceof Placeholder) {
      value.onValue((v) => {
        this[key] = v;
      });
    }

    this[key] = value;
  }
}
