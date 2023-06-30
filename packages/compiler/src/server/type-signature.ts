import { compilerAssert } from "../core/diagnostics.js";
import { getTypeName, isStdNamespace } from "../core/helpers/type-name-utils.js";
import { Program } from "../core/program.js";
import { getFullyQualifiedSymbolName } from "../core/type-utils.js";
import {
  AliasStatementNode,
  Decorator,
  EnumMember,
  FunctionParameter,
  FunctionType,
  ModelProperty,
  Operation,
  Sym,
  SyntaxKind,
  Type,
  UnionVariant,
  ValueType,
} from "../core/types.js";
import { printId } from "../formatter/print/printer.js";

/** @internal */
export function getSymbolSignature(program: Program, sym: Sym): string {
  const decl = sym.declarations[0];
  switch (decl?.kind) {
    case SyntaxKind.AliasStatement:
      return fence(`alias ${getAliasSignature(decl)}`);
  }
  const type = sym.type ?? program.checker.getTypeForNode(decl);
  return getTypeSignature(type);
}

function getTypeSignature(type: Type | ValueType): string {
  switch (type.kind) {
    case "Scalar":
    case "Enum":
    case "Union":
    case "Interface":
    case "Model":
    case "Namespace":
      return fence(`${type.kind.toLowerCase()} ${getPrintableTypeName(type)}`);
    case "Decorator":
      return fence(getDecoratorSignature(type));

    case "Function":
      return fence(getFunctionSignature(type));
    case "Operation":
      return fence(getOperationSignature(type));
    case "Value":
      return `valueof ${getTypeSignature(type)}`;
    case "String":
      // BUG: https://github.com/microsoft/typespec/issues/1350 - should escape string literal values
      return `(string)\n${fence(`"${type.value}"`)}`;
    case "Boolean":
      return `(boolean)\n${fence(type.value ? "true" : "false")}`;
    case "Number":
      return `(number)\n${fence(type.value.toString())}`;
    case "Intrinsic":
      return "";
    case "FunctionParameter":
      return `(function parameter)\n${fence(getFunctionParameterSignature(type))}`;
    case "ModelProperty":
      return `(model property)\n${fence(getModelPropertySignature(type))}`;
    case "ModelValidate":
      return `(model validate)`;
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
  return `fn ${ns}${printId(type.name)}(${parameters.join(", ")}): ${getPrintableTypeName(
    type.returnType
  )}`;
}

function getOperationSignature(type: Operation) {
  const ns = getQualifier(type.namespace) || getQualifier(type.interface);
  const parameters = [...type.parameters.properties.values()].map(getModelPropertySignature);
  return `op ${ns}${type.name}(${parameters.join(", ")}): ${getPrintableTypeName(type.returnType)}`;
}

function getFunctionParameterSignature(parameter: FunctionParameter) {
  const rest = parameter.rest ? "..." : "";
  const optional = parameter.optional ? "?" : "";
  return `${rest}${printId(parameter.name)}${optional}: ${getTypeName(parameter.type)}`;
}

function getModelPropertySignature(property: ModelProperty) {
  const ns = getQualifier(property.model);
  return `${ns}${printId(property.name)}: ${getPrintableTypeName(property.type)}`;
}

function getUnionVariantSignature(variant: UnionVariant) {
  if (typeof variant.name !== "string") {
    return getPrintableTypeName(variant.type);
  }
  const ns = getQualifier(variant.union);
  return `${ns}${printId(variant.name)}: ${getPrintableTypeName(variant.type)}`;
}

function getEnumMemberSignature(member: EnumMember) {
  const ns = getQualifier(member.enum);
  const value = typeof member.value === "string" ? `"${member.value}"` : member.value;
  return value === undefined
    ? `${ns}${printId(member.name)}`
    : `${ns}${printId(member.name)}: ${value}`;
}

function getAliasSignature(alias: AliasStatementNode) {
  const fullName = getFullyQualifiedSymbolName(alias.symbol);
  const args = alias.templateParameters.map((t) => t.id.sv);
  return args.length === 0 ? fullName : `${fullName}<${args.join(", ")}>`;
}

function getQualifier(parent: (Type & { name?: string | symbol }) | undefined) {
  if (
    !parent?.name ||
    typeof parent.name !== "string" ||
    (parent.kind === "Namespace" && isStdNamespace(parent))
  ) {
    return "";
  }

  const parentName = getPrintableTypeName(parent);
  if (!parentName) {
    return "";
  }

  return parentName + ".";
}

function getPrintableTypeName(type: Type) {
  return getTypeName(type, {
    printable: true,
  });
}

function fence(code: string) {
  return `\`\`\`typespec\n${code}\n\`\`\``;
}
