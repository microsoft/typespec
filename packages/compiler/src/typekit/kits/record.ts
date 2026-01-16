import { isRecordModelType } from "../../core/type-utils.js";
import { Entity, Model, RecordModelType, Type } from "../../core/types.js";
import { defineKit } from "../define-kit.js";

/**
 * RecordKit provides utilities for working with Record Model types.
 * @typekit record
 */
export interface RecordKit {
  /**
   * Check if the given `type` is a Record.
   *
   * @param type The type to check.
   */
  is(type: Entity): type is RecordModelType;
  /**
   *  Get the element type of a Record
   * @param type a Record Model type
   */
  getElementType(type: Model): Type;
  /**
   * Create a Record Model type
   * @param elementType The type of the elements in the record
   */
  create(elementType: Type): RecordModelType;
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
        type.entityKind === "Type" &&
        type.kind === "Model" &&
        isRecordModelType(this.program, type) &&
        type.properties.size === 0
      );
    },
    getElementType(type) {
      if (!this.record.is(type)) {
        throw new Error("Type is not a record.");
      }
      return type.indexer!.value;
    },
    create(elementType) {
      return this.model.create({
        name: "Record",
        properties: {},
        indexer: {
          key: this.builtin.string,
          value: elementType,
        },
      }) as RecordModelType;
    },
  },
});
