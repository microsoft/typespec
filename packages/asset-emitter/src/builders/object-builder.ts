import { compilerAssert } from "@typespec/compiler";
import { Placeholder } from "../placeholder.js";
import { type EmitEntity, EmitterResult } from "../types.js";

const placeholderSym = Symbol("placeholder");
const setSym = Symbol("ObjectBuilder.set");
/** Allow generated output properties to be read and written directly on the builder. */
// eslint is confused by merging generic interface and classes
// eslint-disable-next-line @typescript-eslint/no-unused-vars, typescript/no-unsafe-declaration-merging
export interface ObjectBuilder<T> extends Record<string, any> {}
/**
 * Mutable output object with placeholder-aware initialization and assignment.
 * Properties live on the builder itself; use `setProperty` when generated keys
 * could shadow methods. Direct property assignments do not subscribe to placeholders.
 */
export class ObjectBuilder<T> {
  /** Symbol key for the placeholder-aware setter, unaffected by named output properties. */
  public static SET = setSym;

  private readonly [placeholderSym]: Placeholder<any> | undefined;

  /**
   * Copy enumerable string-keyed properties through the placeholder-aware setter.
   * A placeholder initializer supplies properties when it publishes a value.
   * Copying another builder also subscribes to that builder's placeholder initializer,
   * if present; it does not create a general live view of later property assignments.
   */
  constructor(
    initializer:
      Record<string, unknown> | Placeholder<Record<string, unknown>> | ObjectBuilder<T> = {},
  ) {
    const copyProperties = (source: Record<string, unknown>) => {
      for (const [key, value] of Object.entries(source)) {
        this[setSym](key, value as any);
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

  /**
   * Assign an output property with emit-result unwrapping and placeholder updates.
   * @deprecated Use setProperty(builder, key, value)
   */
  set(key: string, v: EmitEntity<T> | Placeholder<T> | T) {
    this[setSym](key, v);
  }

  /**
   * Implement placeholder-aware assignment under `ObjectBuilder.SET`.
   * No-emit results set undefined and circular sentinels are rejected.
   * Placeholder listeners remain active, so later values can overwrite subsequent assignments.
   */
  [setSym](key: string, v: EmitEntity<T> | Placeholder<T> | T) {
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

/**
 * Assign an output property without depending on the builder's named methods.
 * Declarations and raw code are unwrapped; no-emit results set undefined.
 * Placeholders are stored until they publish a value, then update the property
 * in place. Circular sentinels must be resolved through the emitter before assignment.
 */
export function setProperty<T>(
  builder: ObjectBuilder<T>,
  key: string,
  value: EmitEntity<T> | Placeholder<T> | T,
) {
  builder[setSym](key, value);
}
