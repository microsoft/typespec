import { isRecordModelType } from "../../../core/type-utils.js";
import { Model, Type } from "../../../core/types.js";
import { defineKit } from "../define-kit.js";

export interface RecordKit {
  /**
   * Check if the given `type` is a Record.
   *
   * @param type The type to check.
   */
  is(type: Type): type is Model;
  /**
   *  Get the element type of a Record
   * @param type a Record Model type
   */
  getElementType(type: Model): Type;
}

interface TypekitExtension {
  record: RecordKit;
}

declare module "../define-kit.js" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  record: {
    is(type) {
      return (
        type.kind === "Model" && type.name === "Record" && isRecordModelType(this.program, type)
      );
    },
    getElementType(type) {
      if (!this.record.is(type)) {
        throw new Error("Type is not a record.");
      }
      return type.indexer!.value;
    },
  },
});
