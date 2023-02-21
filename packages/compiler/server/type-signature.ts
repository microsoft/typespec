import { compilerAssert } from "../core/diagnostics.js";
import { getTypeName } from "../core/helpers/type-name-utils.js";
import {
  Decorator,
  EnumMember,
  FunctionParameter,
  FunctionType,
  ModelProperty,
  Operation,
  Type,
  UnionVariant,
} from "../core/types.js";
import { printSv } from "../formatter/print/printer.js";

/** @internal */
export function getTypeSignature(type: Type): string {
  switch (type.kind) {
    case "Scalar":
    case "Enum":
    case "Union":
    case "Interface":
    case "Model":
    case "Namespace":
      return fence(`${type.kind.toLowerCase()} ${getTypeName(type)}`);
    case "Decorator":
      return fence(getDecoratorSignature(type));
    case "Function":
      return fence(getFunctionSignature(type));
    case "Operation":
      return fence(getOperationSignature(type));
    case "String":
      // BUG: https://github.com/microsoft/typespec/issues/1350 - should escape string literal values
      return `(string)\n${fence(`"${type.value}"`)}`;
    case "Boolean":
      return `(boolean)\n${fence(type.value ? "true" : "false")}`;
    case "Number":
      return `(number)\n${fence(type.value.toString())}`;
    case "Intrinsic":
      return `(intrinsic)\n${fence(type.name)}`;
    case "FunctionParameter":
      return `(function parameter)\n${fence(getFunctionParameterSignature(type))}`;
    case "ModelProperty":
      return `(model property)\n${fence(getModelPropertySignature(type))}`;
    case "EnumMember":
      return `(enum member)\n${fence(getEnumMemberSignature(type))}`;
    case "TemplateParameter":
      return `(template parameter)\n${fence(type.node.id.sv)}`;
    case "UnionVariant":
      return `(union variant)\n${fence(getUnionVariantSignature(type))}`;
    case "Tuple":
      return `(tuple)\n[${fence(type.values.map(getTypeSignature).join(", "))}]`;
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
  return `fn ${ns}${printSv(type.name)}(${parameters.join(", ")}): ${getTypeName(type.returnType)}`;
}

function getOperationSignature(type: Operation) {
  const ns = getQualifier(type.namespace) || getQualifier(type.interface);
  const parameters = [...type.parameters.properties.values()].map(getModelPropertySignature);
  return `op ${ns}${type.name}(${parameters.join(", ")}): ${getTypeName(type.returnType)}`;
}

function getFunctionParameterSignature(parameter: FunctionParameter) {
  const rest = parameter.rest ? "..." : "";
  const optional = parameter.optional ? "?" : "";
  return `${rest}${printSv(parameter.name)}${optional}: ${getTypeName(parameter.type)}`;
}

function getModelPropertySignature(property: ModelProperty) {
  const ns = getQualifier(property.model);
  return `${ns}${printSv(property.name)}: ${getTypeName(property.type)}`;
}

function getUnionVariantSignature(variant: UnionVariant) {
  if (typeof variant.name !== "string") {
    return getTypeName(variant.type);
  }
  const ns = getQualifier(variant.union);
  return `${ns}${printSv(variant.name)}: ${getTypeName(variant.type)}`;
}

function getEnumMemberSignature(member: EnumMember) {
  const ns = getQualifier(member.enum);
  const value = typeof member.value === "string" ? `"${member.value}"` : member.value;
  return value === undefined
    ? `${ns}${printSv(member.name)}`
    : `${ns}${printSv(member.name)}: ${value}`;
}

function getQualifier(parent: (Type & { name?: string | symbol }) | undefined) {
  if (!parent?.name || typeof parent.name !== "string") {
    return "";
  }

  const parentName = getTypeName(parent);
  if (!parentName) {
    return "";
  }

  return printSv(parentName) + ".";
}

function fence(code: string) {
  return `\`\`\`typespec\n${code}\n\`\`\``;
}
