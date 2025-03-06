import { compilerAssert } from "@typespec/compiler";
import { Placeholder } from "../placeholder.js";
import { type EmitEntity, EmitterResult } from "../types.js";

export class ArrayBuilder<T> extends Array {
  #setPlaceholderValue(p: Placeholder<T>, value: T) {
    for (const [i, item] of this.entries()) {
      if (item === p) {
        this[i] = value;
      }
    }
  }

  push(...values: (EmitEntity<T> | Placeholder<T> | T)[]): number {
    for (const v of values) {
      let toPush: Placeholder<T> | T | undefined;
      if (v instanceof EmitterResult) {
        compilerAssert(v.kind !== "circular", "Can't push a circular emit result.");

        if (v.kind === "none") {
          toPush = undefined;
        } else {
          toPush = v.value;
        }
      } else {
        toPush = v;
      }

      if (toPush instanceof Placeholder) {
        toPush.onValue((v) => this.#setPlaceholderValue(toPush as Placeholder<T>, v));
      }

      super.push(toPush);
    }

    return values.length;
  }
}
