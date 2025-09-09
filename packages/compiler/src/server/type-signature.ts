import { getSymNode } from "../core/binder.js";
import { compilerAssert } from "../core/diagnostics.js";
import { printTypeSpecNode } from "../core/formatter.js";
import { printIdentifier } from "../core/helpers/syntax-utils.js";
import { getEntityName, getTypeName, isStdNamespace } from "../core/helpers/type-name-utils.js";
import type { Program } from "../core/program.js";
import { getFullyQualifiedSymbolName } from "../core/type-utils.js";
import {
  AliasStatementNode,
  Decorator,
  EnumMember,
  FunctionParameter,
  Interface,
  Model,
  ModelProperty,
  Operation,
  StringTemplate,
  Sym,
  SyntaxKind,
  Type,
  UnionVariant,
  Value,
} from "../core/types.js";
import { walkPropertiesInherited } from "../index.js";

interface GetSymbolSignatureOptions {
  /**
   * Whether to include the body in the signature. Only support Model and Interface type now
   */
  includeBody: boolean;
  /**
   * Whether to use formatted template parameters (including default values)
   */
  useFormattedTemplateParameters?: boolean;
}

/** @internal */
export async function getSymbolSignature(
  program: Program,
  sym: Sym,
  options: GetSymbolSignatureOptions = {
    includeBody: false,
  },
): Promise<string> {
  const decl = getSymNode(sym);
  switch (decl?.kind) {
    case SyntaxKind.AliasStatement:
      return fence(`alias ${getAliasSignature(decl)}`);
  }
  const entity = sym.type ?? program.checker.getTypeOrValueForNode(decl);
  return await getEntitySignature(sym, entity, options);
}

async function getEntitySignature(
  sym: Sym,
  entity: Type | Value | null,
  options: GetSymbolSignatureOptions,
): Promise<string> {
  if (entity === null) {
    return "(error)";
  }
  if ("valueKind" in entity) {
    return fence(`const ${sym.name}: ${getTypeName(entity.type)}`);
  }

  return await getTypeSignature(entity, options);
}

async function getTypeSignature(type: Type, options: GetSymbolSignatureOptions): Promise<string> {
  switch (type.kind) {
    case "Scalar":
    case "Enum":
    case "Union":
    case "Namespace":
      return fence(`${type.kind.toLowerCase()} ${getPrintableTypeName(type)}`);
    case "Interface":
      return fence(getInterfaceSignature(type, options.includeBody));
    case "Model":
      return fence(await getModelSignature(type, options));
    case "ScalarConstructor":
      return fence(`init ${getTypeSignature(type.scalar, options)}.${type.name}`);
    case "Decorator":
      return fence(getDecoratorSignature(type));
    case "Operation":
      return fence(getOperationSignature(type));
    case "String":
      // BUG: https://github.com/microsoft/typespec/issues/1350 - should escape string literal values
      return `(string)\n${fence(`"${type.value}"`)}`;
    case "Boolean":
      return `(boolean)\n${fence(type.value ? "true" : "false")}`;
    case "Number":
      return `(number)\n${fence(type.value.toString())}`;
    case "StringTemplate":
      return `(string template)\n${fence(getStringTemplateSignature(type))}`;
    case "StringTemplateSpan":
      return `(string template span)\n${fence(getTypeName(type.type))}`;
    case "Intrinsic":
      return "";
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
      return `(tuple)\n[${fence(type.values.map((v) => getTypeSignature(v, options)).join(", "))}]`;
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

function getOperationSignature(type: Operation, includeQualifier: boolean = true) {
  const parameters = [...type.parameters.properties.values()].map((p) =>
    getModelPropertySignature(p, false /* includeQualifier */),
  );
  return `op ${getTypeName(type, {
    nameOnly: !includeQualifier,
  })}(${parameters.join(", ")}): ${getPrintableTypeName(type.returnType)}`;
}

function getInterfaceSignature(type: Interface, includeBody: boolean) {
  if (includeBody) {
    const INDENT = "  ";
    const opDesc = Array.from(type.operations).map(
      ([name, op]) => INDENT + getOperationSignature(op, false /* includeQualifier */) + ";",
    );
    return `${type.kind.toLowerCase()} ${getPrintableTypeName(type)} {\n${opDesc.join("\n")}\n}`;
  } else {
    return `${type.kind.toLowerCase()} ${getPrintableTypeName(type)}`;
  }
}

/**
 * All properties from 'extends' and 'is' will be included if includeBody is true.
 */
async function getModelSignature(type: Model, options: GetSymbolSignatureOptions): Promise<string> {
  const { includeBody, useFormattedTemplateParameters } = options;

  if (includeBody) {
    const propDesc = [];
    const INDENT = "  ";
    for (const prop of walkPropertiesInherited(type)) {
      propDesc.push(INDENT + getModelPropertySignature(prop, false /*includeQualifier*/));
    }
    return `${type.kind.toLowerCase()} ${getPrintableTypeName(type)}{\n${propDesc.map((d) => `${d};`).join("\n")}\n}`;
  } else {
    if (useFormattedTemplateParameters && type.node) {
      const formatted = await printTypeSpecNode(type.node);
      // Extract the head of the model declaration (excluding body)
      const match = formatted.match(/^(model\s+[^{]+)/);
      if (match && match.length === 2) {
        return match[1].trim();
      }
    }

    return `${type.kind.toLowerCase()} ${getPrintableTypeName(type)}`;
  }
}

function getFunctionParameterSignature(parameter: FunctionParameter) {
  const rest = parameter.rest ? "..." : "";
  const optional = parameter.optional ? "?" : "";
  return `${rest}${printIdentifier(parameter.name, "allow-reserved")}${optional}: ${getEntityName(parameter.type)}`;
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

function getModelPropertySignature(property: ModelProperty, includeQualifier: boolean = true) {
  const ns = includeQualifier ? getQualifier(property.model) : "";
  return `${ns}${printIdentifier(property.name, "allow-reserved")}: ${getPrintableTypeName(property.type)}`;
}

function getUnionVariantSignature(variant: UnionVariant) {
  if (typeof variant.name !== "string") {
    return getPrintableTypeName(variant.type);
  }
  const ns = getQualifier(variant.union);
  return `${ns}${printIdentifier(variant.name, "allow-reserved")}: ${getPrintableTypeName(variant.type)}`;
}

function getEnumMemberSignature(member: EnumMember) {
  const ns = getQualifier(member.enum);
  const value = typeof member.value === "string" ? `"${member.value}"` : member.value;
  return value === undefined
    ? `${ns}${printIdentifier(member.name, "allow-reserved")}`
    : `${ns}${printIdentifier(member.name, "allow-reserved")}: ${value}`;
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

function getPrintableTypeName(type: Type): string {
  return getTypeName(type, {
    printable: true,
  });
}

function fence(code: string) {
  return `\`\`\`typespec\n${code}\n\`\`\``;
}
