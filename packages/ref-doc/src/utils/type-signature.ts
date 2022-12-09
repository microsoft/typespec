import {
  compilerAssert,
  Decorator,
  EnumMember,
  FunctionParameter,
  FunctionType,
  getTypeName,
  ModelProperty,
  Operation,
  Type,
  UnionVariant,
} from "@cadl-lang/compiler";

/** @internal */
export function getTypeSignature(type: Type): string {
  switch (type.kind) {
    case "Scalar":
    case "Enum":
    case "Union":
    case "Interface":
    case "Model":
    case "Namespace":
      return `${type.kind.toLowerCase()} ${getTypeName(type)}`;
    case "Decorator":
      return getDecoratorSignature(type);
    case "Function":
      return getFunctionSignature(type);
    case "Operation":
      return getOperationSignature(type);
    case "String":
      return `(string) ${`"${type.value}"`}`;
    case "Boolean":
      return `(boolean) ${type.value ? "true" : "false"}`;
    case "Number":
      return `(number) ${type.value.toString()}`;
    case "Intrinsic":
      return `(intrinsic) ${type.name}`;
    case "FunctionParameter":
      return getFunctionParameterSignature(type);
    case "ModelProperty":
      return `(model property) ${`${type.name}: ${getTypeName(type.type)}`}`;
    case "EnumMember":
      return `(enum member) ${getEnumMemberSignature(type)}`;
    case "TemplateParameter":
      return type.node.id.sv;
    case "UnionVariant":
      return `(union variant) ${getUnionVariantSignature(type)}`;
    case "Tuple":
      return `(tuple) [${type.values.map(getTypeSignature).join(", ")}]`;
    case "Projection":
      return "(projection)";
    case "Object":
      return "(object)";
    default:
      const _assertNever: never = type;
      compilerAssert(false, "Unexpected type kind");
      return "";
  }
}

function getDecoratorSignature(type: Decorator) {
  const ns = getQualifier(type.namespace);
  const name = type.name.slice(1);
  const parameters = [type.target, ...type.parameters].map((x) => getFunctionParameterSignature(x));
  return `dec ${ns}${name}(${parameters.join(", ")})`;
}

function getFunctionSignature(type: FunctionType) {
  const ns = getQualifier(type.namespace);
  const parameters = type.parameters.map((x) => getFunctionParameterSignature(x));
  return `fn ${ns}${type.name}(${parameters.join(", ")}): ${getTypeName(type.returnType)}`;
}

function getOperationSignature(type: Operation) {
  const ns = getQualifier(type.namespace) || getQualifier(type.interface);
  const parameters = [...type.parameters.properties.values()].map(getModelPropertySignature);
  return `op ${ns}${type.name}(${parameters.join(", ")}): ${getTypeName(type.returnType)}`;
}

function getFunctionParameterSignature(parameter: FunctionParameter) {
  const rest = parameter.rest ? "..." : "";
  const optional = parameter.optional ? "?" : "";
  return `${rest}${parameter.name}${optional}: ${getTypeName(parameter.type)}`;
}

function getModelPropertySignature(property: ModelProperty) {
  const ns = getQualifier(property.model);
  return `${ns}${property.name}: ${getTypeName(property.type)}`;
}

function getUnionVariantSignature(variant: UnionVariant) {
  if (typeof variant.name !== "string") {
    return getTypeName(variant.type);
  }
  const ns = getQualifier(variant.union);
  return `${ns}${variant.name}: ${getTypeName(variant.type)}`;
}

function getEnumMemberSignature(member: EnumMember) {
  const ns = getQualifier(member.enum);
  const value = typeof member.value === "string" ? `"${member.value}"` : member.value;
  return value === undefined ? `${ns}${member.name}` : `${ns}${member.name}: ${value}`;
}

function getQualifier(parent: Type | undefined) {
  if (!parent) {
    return "";
  }

  const parentName = getTypeName(parent);
  if (!parentName || parentName === "Cadl") {
    return "";
  }

  return parentName + ".";
}
