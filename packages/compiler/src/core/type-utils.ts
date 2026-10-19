import type { Program } from "./program.js";
import type {
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
  RecordModelType,
  Sym,
  TemplateDeclarationNode,
  TemplatedType,
  Type,
  TypeMapper,
  UnknownType,
  Value,
  VoidType,
} from "./types.js";
import { SymbolFlags, SyntaxKind } from "./types.js";

/** Check for the compiler's error-recovery type, not a model decorated with `@error`. */
export function isErrorType(type: Entity): type is ErrorType {
  return "kind" in type && type.kind === "Intrinsic" && type.name === "ErrorType";
}

/** Narrow an entity to the intrinsic `void` type used for an absent operation result. */
export function isVoidType(type: Entity): type is VoidType {
  return "kind" in type && type.kind === "Intrinsic" && type.name === "void";
}

/** Narrow an entity to the intrinsic `never` type, which has no possible values. */
export function isNeverType(type: Entity): type is NeverType {
  return "kind" in type && type.kind === "Intrinsic" && type.name === "never";
}

/** Narrow an entity to the intrinsic `unknown` type. */
export function isUnknownType(type: Entity): type is UnknownType {
  return "kind" in type && type.kind === "Intrinsic" && type.name === "unknown";
}

/** Narrow an entity to the intrinsic `null` type. */
export function isNullType(type: Entity): type is NullType {
  return "kind" in type && type.kind === "Intrinsic" && type.name === "null";
}

/** Distinguish a semantic type from a value or a mixed parameter constraint. */
export function isType(entity: Entity): entity is Type {
  return entity.entityKind === "Type";
}
/** Distinguish a runtime value from a semantic type or a mixed parameter constraint. */
export function isValue(entity: Entity): entity is Value {
  return entity.entityKind === "Value";
}

/**
 * Check if a model is an array type.
 * @param program Program (unused)
 * @param type Model type
 * @deprecated Use `isArrayModelType(type)` instead. The `program` parameter is unused.
 */
export function isArrayModelType(program: Program, type: Model): type is ArrayModelType;
/**
 * Check if a model is an array type.
 * @param type Model type
 */
export function isArrayModelType(type: Model): type is ArrayModelType;
export function isArrayModelType(programOrType: Program | Model, maybeType?: Model): boolean {
  const type = maybeType ?? (programOrType as Model);
  return Boolean(type.indexer && type.indexer.key.name === "integer");
}

/**
 * Check if a model is a record type.
 * @param program Program (unused)
 * @param type Model type
 * @deprecated Use `isRecordModelType(type)` instead. The `program` parameter is unused.
 */
export function isRecordModelType(program: Program, type: Model): type is RecordModelType;
/**
 * Check if a model is a record type.
 * @param type Model type
 */
export function isRecordModelType(type: Model): type is RecordModelType;
export function isRecordModelType(programOrType: Program | Model, maybeType?: Model): boolean {
  const type = maybeType ?? (programOrType as Model);
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
    case SyntaxKind.ModelDeclarationExpression:
    case SyntaxKind.ScalarStatement:
    case SyntaxKind.ScalarDeclarationExpression:
    case SyntaxKind.UnionStatement:
    case SyntaxKind.UnionDeclarationExpression:
    case SyntaxKind.InterfaceStatement:
      return node.templateParameters.length > 0 ? node : undefined;
    case SyntaxKind.OperationStatement:
      return node.templateParameters.length > 0
        ? node
        : node.parent?.kind === SyntaxKind.InterfaceStatement
          ? node.parent.templateParameters.length > 0
            ? node.parent
            : undefined
          : undefined;
    case SyntaxKind.OperationSignatureDeclaration:
    case SyntaxKind.ModelProperty:
    case SyntaxKind.UnionVariant:
    case SyntaxKind.ModelExpression:
    case SyntaxKind.UnionExpression:
      return node.parent ? getParentTemplateNode(node.parent) : undefined;
    default:
      return undefined;
  }
}

/**
 * Check the given type is a finished template instance.
 */
export function isTemplateInstance(type: Type): type is TemplatedType & {
  /** Arguments used to instantiate the template. */
  templateArguments: Type[];
  /** Mapping from template parameters to their instantiated arguments. */
  templateMapper: TypeMapper;
} {
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
export function isTemplateDeclaration(type: TemplatedType): type is TemplatedType & {
  /** Syntax declaration that defines the template parameters. */
  node: TemplateDeclarationNode;
} {
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
): namespace is Namespace & {
  /** The global namespace has an empty name. */
  name: "";
  /** The global namespace has no containing namespace. */
  namespace: undefined;
} {
  return program.getGlobalNamespaceType() === namespace;
}

/**
 * Check if the given type is declared in the specified namespace or, optionally, its child namespaces.
 * @param type Type
 * @param namespace Namespace
 * @param options Set `recursive` to include ancestor namespaces. Omitting options enables it.
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
