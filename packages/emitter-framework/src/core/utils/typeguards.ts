import {
  ArrayModelType,
  Enum,
  Interface,
  IntrinsicType,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  RecordModelType,
  Scalar,
  Type,
  Union,
} from "@typespec/compiler";

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
export function isDeclaration(type: Type): type is TypeSpecDeclaration | Namespace {
  switch (type.kind) {
    case "Namespace":
    case "Interface":
    case "Enum":
    case "Operation":
      return true;

    case "Model":
      return type.name ? type.name !== "" && type.name !== "Array" : false;
    case "Union":
      return type.name ? type.name !== "" : false;
    default:
      return false;
  }
}
