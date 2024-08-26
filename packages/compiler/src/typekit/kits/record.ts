import { isRecordModelType, Model, Type } from "../../index.js";
import { defineKit } from "../define-kit.js";

export interface RecordKit {
  record: {
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
  };
}

declare module "../define-kit.js" {
  interface TypekitPrototype extends RecordKit {}
}

defineKit<RecordKit>({
  record: {
    is(type) {
      return type.kind === "Model" && isRecordModelType(this.program, type);
    },
    getElementType(type) {
      if (!this.record.is(type)) {
        throw new Error("Type is not a record.");
      }
      return type.indexer!.value;
    },
  },
});
