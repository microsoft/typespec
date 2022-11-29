import { Program } from "./program.js";
import {
  Enum,
  Interface,
  Model,
  Namespace,
  Node,
  Operation,
  SyntaxKind,
  TemplateDeclarationNode,
  TemplatedType,
  Type,
} from "./types.js";

/**
 * Lookup and find the node
 * @param node Node
 * @returns Template Parent node if applicable
 */
export function getParentTemplateNode(node: Node): (Node & TemplateDeclarationNode) | undefined {
  switch (node.kind) {
    case SyntaxKind.ModelStatement:
    case SyntaxKind.OperationStatement:
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
 * Check if the given type has template arguments.
 */
export function isTemplateInstance(
  type: Type
): type is TemplatedType & { templateArguments: Type[] } {
  const maybeTemplateType = type as TemplatedType;
  return (
    maybeTemplateType.templateArguments !== undefined &&
    maybeTemplateType.templateArguments.length > 0
  );
}

/**
 * Resolve if the type is a template type declaration(Non initialized template type).
 */
export function isTemplateDeclaration(type: TemplatedType): boolean {
  if (type.node === undefined) {
    return false;
  }
  const node = type.node as TemplateDeclarationNode;
  return node.templateParameters && node.templateParameters.length > 0 && !isTemplateInstance(type);
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
  namespace: Namespace
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
  options: { recursive?: boolean } = { recursive: true }
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
