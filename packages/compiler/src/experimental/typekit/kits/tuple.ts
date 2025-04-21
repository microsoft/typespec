import { Tuple, Type } from "../../../core/types.js";
import { defineKit } from "../define-kit.js";

/**
 * @experimental
 */
export interface TupleKit {
  /**
   * Check if a type is a tuple.
   */
  is(type: Type): type is Tuple;
  /**
   * Creates a tuple type.
   *
   * @param values The tuple values, if any.
   */
  create(values?: Type[]): Tuple;
}

interface TypekitExtension {
  /** @experimental */
  tuple: TupleKit;
}

declare module "../define-kit.js" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  tuple: {
    is(type) {
      return type.kind === "Tuple";
    },
    create(values: Type[] = []): Tuple {
      const tuple: Tuple = this.program.checker.createType({
        kind: "Tuple",
        name: "Tuple",
        values,
        node: undefined as any,
      });

      this.program.checker.finishType(tuple);
      return tuple;
    },
  },
});
