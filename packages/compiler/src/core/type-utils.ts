import type { Program } from "./program.js";
import {
  ArrayModelType,
  Entity,
  Enum,
  ErrorType,
  Interface,
  Model,
  Namespace,
  NeverType,
  Node,
  NullType,
  Operation,
  Sym,
  SymbolFlags,
  SyntaxKind,
  TemplateDeclarationNode,
  TemplatedType,
  Type,
  TypeMapper,
  UnknownType,
  Value,
  VoidType,
} from "./types.js";

export function isErrorType(type: Entity): type is ErrorType {
  return "kind" in type && type.kind === "Intrinsic" && type.name === "ErrorType";
}

export function isVoidType(type: Entity): type is VoidType {
  return "kind" in type && type.kind === "Intrinsic" && type.name === "void";
}

export function isNeverType(type: Entity): type is NeverType {
  return "kind" in type && type.kind === "Intrinsic" && type.name === "never";
}

export function isUnknownType(type: Entity): type is UnknownType {
  return "kind" in type && type.kind === "Intrinsic" && type.name === "unknown";
}

export function isNullType(type: Entity): type is NullType {
  return "kind" in type && type.kind === "Intrinsic" && type.name === "null";
}

export function isType(entity: Entity): entity is Type {
  return entity.entityKind === "Type";
}
export function isValue(entity: Entity): entity is Value {
  return entity.entityKind === "Value";
}

/**
 * @param type Model type
 */
export function isArrayModelType(program: Program, type: Model): type is ArrayModelType {
  return Boolean(type.indexer && type.indexer.key.name === "integer");
}

/**
 * Check if a model is an array type.
 * @param type Model type
 */
export function isRecordModelType(program: Program, type: Model): type is ArrayModelType {
  return Boolean(type.indexer && type.indexer.key.name === "string");
}

/**
 * Lookup and find the node
 * @param node Node
 * @returns Template Parent node if applicable
 */
export function getParentTemplateNode(node: Node): (Node & TemplateDeclarationNode) | undefined {
  switch (node.kind) {
    case SyntaxKind.ModelStatement:
    case SyntaxKind.ScalarStatement:
    case SyntaxKind.OperationStatement:
    case SyntaxKind.UnionStatement:
    case SyntaxKind.InterfaceStatement:
      return node.templateParameters.length > 0 ? node : undefined;
    case SyntaxKind.OperationSignatureDeclaration:
    case SyntaxKind.ModelProperty:
    case SyntaxKind.ModelExpression:
      return node.parent ? getParentTemplateNode(node.parent) : undefined;
    default:
      return undefined;
  }
}

/**
 * Check the given type is a finished template instance.
 */
export function isTemplateInstance(
  type: Type,
): type is TemplatedType & { templateArguments: Type[]; templateMapper: TypeMapper } {
  const maybeTemplateType = type as TemplatedType;
  return (
    maybeTemplateType.templateMapper !== undefined &&
    !maybeTemplateType.templateMapper.partial &&
    maybeTemplateType.isFinished
  );
}

/**
 * Check if the type is a declared type. This include:
 * - non templated type
 * - template declaration
 */
export function isDeclaredType(type: Type): boolean {
  if (type.node === undefined) {
    return false;
  }
  const node = type.node as TemplateDeclarationNode;
  return (
    node.templateParameters === undefined || (type as TemplatedType).templateMapper === undefined
  );
}

/**
 * Resolve if the type is a template type declaration(Non initialized template type).
 */
export function isTemplateDeclaration(
  type: TemplatedType,
): type is TemplatedType & { node: TemplateDeclarationNode } {
  if (type.node === undefined) {
    return false;
  }
  const node = type.node as TemplateDeclarationNode;
  return (
    node.templateParameters &&
    node.templateParameters.length > 0 &&
    type.templateMapper === undefined
  );
}

/**
 * Resolve if the type was created from a template type or is a template type declaration.
 */
export function isTemplateDeclarationOrInstance(type: TemplatedType): boolean {
  if (type.node === undefined) {
    return false;
  }
  const node = type.node as TemplateDeclarationNode;
  return node.templateParameters && node.templateParameters.length > 0;
}

/**
 * Check if the given namespace is the global namespace
 * @param program Program
 * @param namespace Namespace
 * @returns {boolean}
 */
export function isGlobalNamespace(
  program: Program,
  namespace: Namespace,
): namespace is Namespace & { name: ""; namespace: undefined } {
  return program.getGlobalNamespaceType() === namespace;
}

/**
 * Check if the given type is declared in the specified namespace or, optionally, its child namespaces.
 * @param type Type
 * @param namespace Namespace
 * @returns {boolean}
 */
export function isDeclaredInNamespace(
  type: Model | Operation | Interface | Namespace | Enum,
  namespace: Namespace,
  options: { recursive?: boolean } = { recursive: true },
) {
  let candidateNs = type.namespace;
  while (candidateNs) {
    if (candidateNs === namespace) {
      return true;
    }

    // Operations can be defined inside of an interface that is defined in the
    // desired namespace
    if (type.kind === "Operation" && type.interface && type.interface.namespace === namespace) {
      return true;
    }

    // If we are allowed to check recursively, walk up the namespace hierarchy
    candidateNs = options.recursive ? candidateNs.namespace : undefined;
  }

  return false;
}

export function getFullyQualifiedSymbolName(
  sym: Sym | undefined,
  options?: { useGlobalPrefixAtTopLevel?: boolean },
): string {
  if (!sym) return "";
  if (sym.symbolSource) sym = sym.symbolSource;
  const parent =
    sym.parent && !(sym.parent.flags & SymbolFlags.SourceFile) ? sym.parent : undefined;
  const name = sym.flags & SymbolFlags.Decorator ? sym.name.slice(1) : sym.name;

  if (parent?.name) {
    return `${getFullyQualifiedSymbolName(parent)}.${name}`;
  } else if (options?.useGlobalPrefixAtTopLevel) {
    return `global.${name}`;
  } else {
    return name;
  }
}
