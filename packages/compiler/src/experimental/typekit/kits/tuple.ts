import { Tuple, Type } from "../../../core/types.js";
import { defineKit } from "../define-kit.js";

export interface TupleDescriptor {
  /**
   * The values for the tuple.
   */
  values?: Type[];
}

/**
 * @experimental
 */
export interface TupleKit {
  /**
   * Check if a type is a tuple.
   */
  is(type: Type): type is Tuple;
  /**
   * Creates a tuple from a descriptor.
   *
   * @param desc The descriptor of the tuple. Passing no descriptor creates an empty tuple.
   * @returns The tuple type.
   */
  create(desc?: TupleDescriptor): Tuple;
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
    create(desc) {
      const tuple: Tuple = this.program.checker.createType({
        kind: "Tuple",
        name: "Tuple",
        values: desc?.values ?? [], // TODO: should this take type descriptors or types?
        node: undefined as any, // TODO: what should node be?
      });

      this.program.checker.finishType(tuple);
      return tuple;
    },
  },
});
