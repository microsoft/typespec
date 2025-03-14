import {
  compilerAssert,
  Decorator,
  EnumMember,
  FunctionParameter,
  getEntityName,
  getTypeName,
  Interface,
  Model,
  ModelProperty,
  Operation,
  StringTemplate,
  Type,
  UnionVariant,
} from "@typespec/compiler";
import { TemplateParameterDeclarationNode } from "@typespec/compiler/ast";

/** @internal */
export function getTypeSignature(type: Type): string {
  if (isReflectionType(type)) {
    return type.name;
  }
  switch (type.kind) {
    case "Scalar":
    case "Enum":
    case "Union":
    case "Model":
    case "Namespace":
      return `${type.kind.toLowerCase()} ${getTypeName(type)}`;
    case "Interface":
      return getInterfaceSignature(type);
    case "Decorator":
      return getDecoratorSignature(type);
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
    case "ScalarConstructor":
      return `(scalar constructor) ${getTypeName(type)}`;
    case "StringTemplate":
      return `(string template)\n${getStringTemplateSignature(type)}`;
    case "StringTemplateSpan":
      return `(string template span)\n${getTypeName(type.type)}`;
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
    default:
      const _assertNever: never = type;
      compilerAssert(false, "Unexpected type kind");
  }
}

function isReflectionType(type: Type): type is Model & { name: "" } {
  return (
    type.kind === "Model" &&
    type.namespace?.name === "Reflection" &&
    type.namespace?.namespace?.name === "TypeSpec"
  );
}

function getDecoratorSignature(type: Decorator) {
  const ns = getQualifier(type.namespace);
  const name = type.name.slice(1);
  const parameters = [...type.parameters].map((x) => getFunctionParameterSignature(x));
  let signature = `@${ns}${name}`;
  if (parameters.length > 0) {
    signature += `(${parameters.join(", ")})`;
  }
  return signature;
}

function getInterfaceSignature(type: Interface) {
  const ns = getQualifier(type.namespace);

  const templateParams = type.node.templateParameters
    ? getTemplateParameters(type.node.templateParameters)
    : "";
  return `interface ${ns}${type.name}${templateParams}`;
}

function getTemplateParameters(templateParameters: readonly TemplateParameterDeclarationNode[]) {
  const params = templateParameters.map((x) => `${x.id.sv}`);
  return `<${params.join(", ")}>`;
}
function getOperationSignature(type: Operation) {
  const qualifier = getQualifier(type.interface ?? type.namespace);
  const parameters = [...type.parameters.properties.values()].map(getModelPropertySignature);
  return `op ${qualifier}${type.name}(${parameters.join(", ")}): ${getTypeName(type.returnType)}`;
}

function getFunctionParameterSignature(parameter: FunctionParameter) {
  const rest = parameter.rest ? "..." : "";
  const optional = parameter.optional ? "?" : "";
  return `${rest}${parameter.name}${optional}: ${getEntityName(parameter.type)}`;
}

function getStringTemplateSignature(stringTemplate: StringTemplate) {
  return (
    "`" +
    [
      stringTemplate.spans.map((span) => {
        return span.isInterpolated ? "${" + getTypeName(span.type) + "}" : span.type.value;
      }),
    ].join("") +
    "`"
  );
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

export function getQualifier(parent: (Type & { name?: string | symbol }) | undefined) {
  if (!parent?.name || typeof parent.name !== "string") {
    return "";
  }

  const parentName = getTypeName(parent);
  if (!parentName || parentName === "TypeSpec") {
    return "";
  }

  return parentName + ".";
}
