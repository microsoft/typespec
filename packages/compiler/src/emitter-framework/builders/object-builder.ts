import { compilerAssert } from "../../core/index.js";
import { Placeholder } from "../placeholder.js";
import { EmitEntity, EmitterResult } from "../types.js";

const placeholderSym = Symbol("placeholder");
// eslint is confused by merging generic interface and classes
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ObjectBuilder<T> extends Record<string, any> {}
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class ObjectBuilder<T> {
  private readonly [placeholderSym]: Placeholder<any> | undefined;

  constructor(
    initializer:
      | Record<string, unknown>
      | Placeholder<Record<string, unknown>>
      | ObjectBuilder<T> = {},
  ) {
    const copyProperties = (source: Record<string, unknown>) => {
      for (const [key, value] of Object.entries(source)) {
        this.set(key, value as any);
      }
    };
    const registerPlaceholder = (placeholder: Placeholder<Record<string, unknown>>) => {
      placeholder.onValue(copyProperties);
    };

    if (initializer instanceof ObjectBuilder) {
      if (initializer[placeholderSym]) {
        this[placeholderSym] = initializer[placeholderSym];
        registerPlaceholder(initializer[placeholderSym]);
      }
      copyProperties(initializer);
    } else if (initializer instanceof Placeholder) {
      this[placeholderSym] = initializer;

      registerPlaceholder(initializer);
    } else {
      copyProperties(initializer);
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
