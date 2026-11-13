import { getSourceLocation } from "../diagnostics.js";
import type { Program } from "../program.js";
import {
  SyntaxKind,
  type DiagnosticTarget,
  type ModelProperty,
  type Node,
  type TemplateParameter,
  type Type,
  type TypeMapper,
  type TypeReferenceNode,
} from "../types.js";
import { getLocationContext } from "./location-context.js";

/**
 * Why a library declaration shows up in the project:
 * - `argument`: the user wrote a template argument the declaration is built from (`Wrapper<uuid>`).
 * - `composition`: the user composed it in (`...Shared`, `model A is Shared`, `A & B` as a template argument).
 */
export type UsageSiteKind = "argument" | "composition";

export interface UsageSite {
  readonly kind: UsageSiteKind;
  readonly node: Node;
}

/**
 * Find the node the user wrote that is responsible for a library declaration existing in their project.
 * Only nodes in the project are returned, so library-internal declarations (intrinsics, a template's own
 * members, interfaces extended from a library) resolve to nothing.
 */
export function findUsageSite(program: Program, target: DiagnosticTarget): UsageSite | undefined {
  if (typeof target !== "object" || !("kind" in target) || typeof target.kind !== "string") {
    return undefined;
  }
  const type = target as Type;
  if (type.kind !== "ModelProperty") return undefined;

  const origins = getOrigins(type);
  return findArgument(program, type, origins) ?? findComposition(program, type, origins);
}

/** The property and every property it was copied from (spread, `is`, template instantiation). */
function getOrigins(prop: ModelProperty): ModelProperty[] {
  const result: ModelProperty[] = [];
  for (let p: ModelProperty | undefined = prop; p && !result.includes(p); p = p.sourceProperty) {
    result.push(p);
  }
  return result;
}

function isInProject(program: Program, target: DiagnosticTarget): boolean {
  return (
    !getSourceLocation(target).isSynthetic && getLocationContext(program, target).type === "project"
  );
}

function* getMappers(origins: ModelProperty[]): Generator<TypeMapper> {
  for (const origin of origins) {
    for (let mapper = origin.model?.templateMapper; mapper; mapper = mapper.source.mapper) {
      yield mapper;
    }
  }
}

function findArgument(
  program: Program,
  prop: ModelProperty,
  origins: ModelProperty[],
): UsageSite | undefined {
  // Only a property whose declared type is written in terms of a template parameter (`value: T`,
  // `items: T[]`) gets its type from the user. A property that merely has the same type as an
  // argument (`id: string` next to `Wrapper<string>`) is the library's own declaration.
  const suppliedTypes = getTemplateParameterArguments(program, origins);

  for (const mapper of getMappers(origins)) {
    const reference = mapper.source.node;
    if (reference.kind !== SyntaxKind.TypeReference || !isInProject(program, reference)) {
      continue;
    }
    for (const written of (reference as TypeReferenceNode).arguments) {
      const type = tryGetType(program, written.argument);
      if (type && suppliedTypes.has(type)) {
        return { kind: "argument", node: written.argument };
      }
      if (type && isComposedFrom(type, origins)) {
        return { kind: "composition", node: narrowToOperand(program, written.argument, origins) };
      }
    }
  }
  return undefined;
}

/** Types substituted for the template parameters referenced by the property's declared type. */
function getTemplateParameterArguments(program: Program, origins: ModelProperty[]): Set<Type> {
  const result = new Set<Type>();
  for (const origin of origins) {
    const node = origin.node;
    const mapper = origin.model?.templateMapper;
    if (node?.kind !== SyntaxKind.ModelProperty || !mapper) continue;
    for (const param of getReferencedTemplateParameters(program, node.value)) {
      const arg = mapper.getMappedType(param);
      if (
        arg &&
        "kind" in arg &&
        typeof arg.kind === "string" &&
        arg.kind !== "TemplateParameter"
      ) {
        result.add(arg as Type);
      }
    }
  }
  return result;
}

function getReferencedTemplateParameters(
  program: Program,
  expr: Node,
  depth = 0,
): TemplateParameter[] {
  if (depth > 4) return [];
  switch (expr.kind) {
    case SyntaxKind.TypeReference: {
      const type = tryGetType(program, expr);
      return type?.kind === "TemplateParameter" ? [type] : [];
    }
    case SyntaxKind.ArrayExpression:
      return getReferencedTemplateParameters(program, expr.elementType, depth + 1);
    case SyntaxKind.UnionExpression:
      return expr.options.flatMap((x) => getReferencedTemplateParameters(program, x, depth + 1));
    default:
      return [];
  }
}

function tryGetType(program: Program, node: Node): Type | undefined {
  try {
    return program.checker.getTypeForNode(node);
  } catch {
    return undefined;
  }
}

function findComposition(
  program: Program,
  prop: ModelProperty,
  origins: ModelProperty[],
): UsageSite | undefined {
  const node = prop.model?.node;
  if (!node || !isInProject(program, node)) return undefined;
  const candidates: TypeReferenceNode[] = [];
  if (node.kind === SyntaxKind.ModelStatement || node.kind === SyntaxKind.ModelExpression) {
    for (const member of node.properties) {
      if (member.kind === SyntaxKind.ModelSpreadProperty) candidates.push(member.target);
    }
  }
  if (node.kind === SyntaxKind.ModelStatement && node.is?.kind === SyntaxKind.TypeReference) {
    candidates.push(node.is);
  }
  const sources = new Set<Type>(origins.slice(1).map((x) => x.model as Type));
  for (const candidate of candidates) {
    const type = tryGetType(program, candidate);
    if (type && sources.has(type)) {
      return { kind: "composition", node: candidate };
    }
  }
  return undefined;
}

/** For `A & B & C`, the operand the property came from rather than the whole expression. */
function narrowToOperand(program: Program, node: Node, origins: ModelProperty[]): Node {
  if (node.kind !== SyntaxKind.IntersectionExpression) return node;
  for (const operand of node.options) {
    const type = tryGetType(program, operand);
    if (type && isComposedFrom(type, origins)) return operand;
  }
  return node;
}

function isComposedFrom(arg: Type, origins: ModelProperty[]): boolean {
  if (arg.kind !== "Model") return false;
  for (const p of arg.properties.values()) {
    if (getOrigins(p).some((o) => origins.includes(o))) return true;
  }
  return false;
}
