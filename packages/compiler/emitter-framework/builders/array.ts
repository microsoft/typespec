import { Placeholder } from "../placeholder.js";
import { EmitEntity, EmitterResult } from "../types.js";

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
      let toPush: Placeholder<T> | T | null;
      if (v instanceof EmitterResult) {
        if (v.kind === "none") {
          toPush = null;
        } else if (v.kind === "code" || v.kind === "declaration") {
          toPush = v.value;
        } else {
          console.log("DIE")
          throw "Circular";
        }
      } else {
        toPush = v;
      }

      if (toPush instanceof Placeholder) {
        console.log("pushing placeholder");
        toPush.onValue(v => this.#setPlaceholderValue(toPush as Placeholder<T>, v));
      }

      super.push(toPush);
    }

    return values.length;
  }
}