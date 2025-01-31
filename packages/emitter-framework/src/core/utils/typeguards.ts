import {
  ArrayModelType,
  Enum,
  Interface,
  IntrinsicType,
  Model,
  ModelProperty,
  Operation,
  RecordModelType,
  Scalar,
  Type,
  Union,
} from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";

export function isModel(type: any): type is Model {
  return type.kind === "Model";
}

export function isInterface(type: any): type is Interface {
  return type.kind === "Interface";
}

export function isOperation(type: any): type is Operation {
  return type.kind === "Operation";
}

export function isModelProperty(type: any): type is ModelProperty {
  return type.kind === "ModelProperty";
}

export function isScalar(type: any): type is Scalar {
  return type.kind === "Scalar";
}

export function isIntrinsic(type: any): type is IntrinsicType {
  return type.kind === "Intrinsic";
}

export function isArray(type: any): type is ArrayModelType {
  return type.name === "Array" && Boolean(type.indexer);
}

export function isRecord(type: any): type is RecordModelType {
  return type.name === "Record" && Boolean(type.indexer);
}

export type TypeSpecDeclaration =
  | Model
  | Interface
  | Union
  | Operation
  | Enum
  | Scalar
  | IntrinsicType;

/**
 * Returns true if the given type is a declaration or an instantiation of a declaration.
 * @param type
 * @returns
 */
export function isDeclaration(type: Type): boolean {
  switch (type.kind) {
    case "Namespace":
    case "Interface":
    case "Enum":
    case "Operation":
    case "EnumMember":
      return true;
    case "UnionVariant":
      return false;

    case "Model":
      if ($.array.is(type) || $.record.is(type)) {
        return false;
      }

      return Boolean(type.name);
    case "Union":
      return Boolean(type.name);
    default:
      return false;
  }
}
