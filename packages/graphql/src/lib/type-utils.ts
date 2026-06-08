import {
  type ArrayModelType,
  type Enum,
  getDoc,
  getTypeName,
  type IndeterminateEntity,
  isNeverType,
  isNullType,
  isTemplateInstance,
  type Model,
  type Program,
  type RecordModelType,
  type Scalar,
  type Type,
  type Union,
  type UnionVariant,
  type Value,
  walkPropertiesInherited,
} from "@typespec/compiler";
import {
  type AliasStatementNode,
  type IdentifierNode,
  type ModelPropertyNode,
  type ModelStatementNode,
  type Node,
  SyntaxKind,
} from "@typespec/compiler/ast";
import { camelCase, constantCase, pascalCase, split, splitSeparateNumbers } from "change-case";
import { reportDiagnostic } from "../lib.js";

/**
 * Extract the inner type from a nullable wrapper union (e.g., `string | null` → `string`).
 * Matches only the `T | null` pattern (exactly 2 variants, one of which is null).
 *
 * These unions are not "real" unions in GraphQL terms — they're just TypeSpec's
 * way of spelling "nullable T". The mutation engine replaces them with the inner type.
 *
 * For multi-variant unions that contain null (e.g. `Cat | Dog | null`),
 * use {@link stripNullVariants} instead.
 *
 * @returns The non-null variant type if this is a nullable wrapper, otherwise undefined.
 */
export function unwrapNullableUnion(union: Union): Type | undefined {
  if (union.variants.size !== 2) return undefined;
  const variants = Array.from(union.variants.values());
  const nullVariant = variants.find((v) => isNullType(v.type));
  if (!nullVariant) return undefined;
  return variants.find((v) => v !== nullVariant)?.type;
}

/**
 * Check whether a type is a `T | null` union (exactly two variants, one null).
 */
export function isNullableUnion(type: Type): boolean {
  return type.kind === "Union" && unwrapNullableUnion(type) !== undefined;
}

/**
 * Strip null variants from a union, returning the remaining variants
 * and whether the union contained null.
 *
 * Used by the mutation engine to handle unions like `Cat | Dog | null`:
 * the null is removed, the remaining variants are processed as a real union,
 * and the nullability is tracked separately via the nullable state map.
 */
export function stripNullVariants(union: Union): {
  variants: UnionVariant[];
  isNullable: boolean;
} {
  const allVariants = Array.from(union.variants.values());
  const nonNullVariants = allVariants.filter((v) => !isNullType(v.type));
  return {
    variants: nonNullVariants,
    isNullable: nonNullVariants.length < allVariants.length,
  };
}

/** Generate a GraphQL type name for a templated model (e.g., `ListOfString`). */
export function getTemplatedModelName(model: Model): string {
  const name = getTypeName(model, {});
  const baseName = toTypeName(name.replace(/<[^>]*>/g, ""));
  const templateString = getTemplateString(model);
  return templateString ? `${baseName}Of${templateString}` : baseName;
}

function splitWithAcronyms(
  splitFn: (name: string) => string[],
  skipStart: boolean,
  name: string,
): string[] {
  const parts = splitFn(name);

  if (name === name.toUpperCase()) {
    return parts;
  }
  // Split consecutive capital letters into individual characters for proper casing,
  // e.g. "API" becomes ["A", "P", "I"] so PascalCase produces "Api" → but we preserve
  // all-caps names at the toTypeName level, so this only affects mixed-case like "APIResponse".
  return parts.flatMap((part, index) => {
    if (skipStart && index === 0) return part;
    if (part.match(/^[A-Z]+$/)) return part.split("");
    return part;
  });
}

/** Convert a name to PascalCase for GraphQL type names. */
export function toTypeName(name: string): string {
  const sanitized = sanitizeNameForGraphQL(getNameWithoutNamespace(name));
  // Preserve all-caps names (acronyms like API, HTTP, URL)
  if (/^[A-Z]+$/.test(sanitized)) {
    return sanitized;
  }
  return pascalCase(sanitized, {
    split: splitWithAcronyms.bind(null, split, false),
  });
}

/**
 * Sanitize a name to conform to GraphQL identifier format.
 * Handles character-level formatting only (special chars, leading digits, array syntax).
 */
export function sanitizeNameForGraphQL(name: string, prefix: string = ""): string {
  name = name.replace("[]", "Array");
  name = name.replaceAll(/\W/g, "_");
  if (!/^[_a-zA-Z]/.test(name)) {
    name = `${prefix}_${name}`;
  }
  return name;
}

/** Convert a name to CONSTANT_CASE for GraphQL enum members. */
export function toEnumMemberName(enumName: string, name: string) {
  return constantCase(sanitizeNameForGraphQL(name, enumName), {
    split: splitSeparateNumbers,
    prefixCharacters: "_",
  });
}

/** Convert a name to camelCase for GraphQL field names. */
export function toFieldName(name: string): string {
  return camelCase(sanitizeNameForGraphQL(name), {
    prefixCharacters: "_",
    split: splitWithAcronyms.bind(null, split, true),
  });
}

function getNameWithoutNamespace(name: string): string {
  const parts = name.trim().split(".");
  return parts[parts.length - 1];
}

/** Generate a GraphQL type name for a union, including anonymous unions. */
export function getUnionName(union: Union, program: Program): string {
  // Named union — use its name directly
  if (union.name) {
    return union.name;
  }

  const ts = getTemplateString(union);
  const templateString = ts ? "Of" + ts : "";

  // Anonymous return type — name after the operation
  // e.g. op getBaz(): Foo | Bar => GetBazUnion
  if (isReturnType(union)) {
    return `${getUnionNameForOperation(program, union)}${templateString}Union`;
  }

  // Anonymous model property — name after model + property
  // e.g. model Foo { bar: Bar | Baz } => FooBarUnion
  const modelProperty = getModelProperty(union);
  if (modelProperty) {
    const propName = toTypeName(getNameForNode(modelProperty));
    const unionModel = union.node?.parent?.parent as ModelStatementNode;
    const modelName = unionModel ? getNameForNode(unionModel) : "";
    return `${modelName}${propName}${templateString}Union`;
  }

  // Alias — name after the alias
  // e.g. alias Baz = Foo<string> | Bar => Baz
  const alias = getAlias(union);
  if (alias) {
    const aliasName = getNameForNode(alias);
    return `${aliasName}${templateString}`;
  }

  reportDiagnostic(program, {
    code: "unrecognized-union",
    target: union,
  });
  return "UnknownUnion";
}

function isNamedType(type: Type | Value | IndeterminateEntity): type is { name: string } & Type {
  return "name" in type && typeof (type as { name: unknown }).name === "string";
}

function isAliased(union: Union): boolean {
  return union.node?.parent?.kind === SyntaxKind.AliasStatement;
}

function getAlias(union: Union): AliasStatementNode | undefined {
  return isAliased(union) ? (union.node?.parent as AliasStatementNode) : undefined;
}

function isModelProperty(union: Union): boolean {
  return union.node?.parent?.kind === SyntaxKind.ModelProperty;
}

function getModelProperty(union: Union): ModelPropertyNode | undefined {
  return isModelProperty(union) ? (union.node?.parent as ModelPropertyNode) : undefined;
}

function isReturnType(type: Type): boolean {
  return !!(
    type.node &&
    type.node.parent?.kind === SyntaxKind.OperationSignatureDeclaration &&
    type.node.parent?.parent?.kind === SyntaxKind.OperationStatement
  );
}

type NamedNode = Node & { id: IdentifierNode };

function getNameForNode(node: NamedNode): string {
  return "id" in node && node.id?.kind === SyntaxKind.Identifier ? node.id.sv : "";
}

function getUnionNameForOperation(program: Program, union: Union): string {
  const operationNode = union.node?.parent?.parent;
  if (!operationNode) return "Unknown";
  const operation = program.checker.getTypeForNode(operationNode);

  return toTypeName(getTypeName(operation));
}

/** Convert a namespaced name to a single name by replacing dots with underscores. */
export function getSingleNameWithNamespace(name: string): string {
  return name.trim().replace(/\./g, "_");
}

/**
 * Check if a model is an array type.
 */
export function isArray(model: Model): model is ArrayModelType {
  return Boolean(model.indexer && model.indexer.key.name === "integer");
}

/**
 * Check if a model is a record/map type.
 */
export function isRecordType(type: Model): type is RecordModelType {
  return Boolean(type.indexer && type.indexer.key.name === "string");
}

/** Check if a model is an array of scalars or enums. */
export function isScalarOrEnumArray(type: Model): type is ArrayModelType {
  return (
    isArray(type) && (type.indexer?.value.kind === "Scalar" || type.indexer?.value.kind === "Enum")
  );
}

/** Check if a model is an array of unions. */
export function isUnionArray(type: Model): type is ArrayModelType {
  return isArray(type) && type.indexer?.value.kind === "Union";
}

/** Extract the element type from an array model, or return the model itself. */
export function unwrapModel(model: ArrayModelType): Model | Scalar | Enum | Union;
export function unwrapModel(model: Exclude<Model, ArrayModelType>): Model;
export function unwrapModel(model: Model): Model | Scalar | Enum | Union {
  if (!isArray(model)) {
    return model;
  }

  if (model.indexer?.value.kind) {
    if (["Model", "Scalar", "Enum", "Union"].includes(model.indexer.value.kind)) {
      return model.indexer.value as Model | Scalar | Enum | Union;
    }
    throw new Error(`Unexpected array type: ${model.indexer.value.kind}`);
  }
  return model;
}

/** Unwrap array types to get the inner element type. */
export function unwrapType(type: Model): Model | Scalar | Enum | Union;
export function unwrapType(type: Type): Type;
export function unwrapType(type: Type): Type {
  if (type.kind === "Model") {
    return unwrapModel(type);
  }
  return type;
}

/** Get the GraphQL description for a type from its doc comments. */
export function getGraphQLDoc(program: Program, type: Type): string | undefined {
  // GraphQL uses CommonMark for descriptions
  // https://spec.graphql.org/October2021/#sec-Descriptions
  return getDoc(program, type);
}

/** Generate a string representation of template arguments (e.g., `StringAndInt`). */
export function getTemplateString(
  type: Type,
  options: { conjunction: string } = { conjunction: "And" },
): string {
  if (isTemplateInstance(type)) {
    const args = type.templateMapper.args.filter(isNamedType).map((arg) => getTypeName(arg));
    return getTemplateStringInternal(args, options);
  }
  return "";
}

function getTemplateStringInternal(
  args: string[],
  options: { conjunction: string } = { conjunction: "And" },
): string {
  // Apply toTypeName to convert raw compiler names (e.g., "string") to GraphQL PascalCase ("String")
  return args.length > 0 ? args.map(toTypeName).join(options.conjunction) : "";
}

/** Check if a model should be emitted as a GraphQL object type (not an array, record, or never). */
export function isTrueModel(model: Model): boolean {
  if (isScalarOrEnumArray(model)) return false;
  if (isUnionArray(model)) return false;
  if (isNeverType(model)) return false;
  if (isRecordType(model) && [...walkPropertiesInherited(model)].length === 0) return false;
  return true;
}
