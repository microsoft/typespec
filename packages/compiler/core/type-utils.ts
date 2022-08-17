import { Program } from "./program.js";
import { Namespace, TemplateDeclarationNode, TemplatedType, Type } from "./types.js";

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
  return node.templateParameters.length > 0 && !isTemplateInstance(type);
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

export function isGlobalNamespace(
  program: Program,
  namespace: Namespace
): namespace is Namespace & { name: "" } {
  return program.checker.getGlobalNamespaceType() === namespace;
}
