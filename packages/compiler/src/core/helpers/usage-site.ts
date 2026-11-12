import { getSourceLocation } from "../diagnostics.js";
import type { Program } from "../program.js";
import {
  SyntaxKind,
  type DiagnosticTarget,
  type ModelProperty,
  type Node,
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

const allKinds: readonly UsageSiteKind[] = ["argument", "composition"];

/**
 * Find the node the user wrote that is responsible for a library declaration existing in their project.
 * Only nodes in the project are returned, so library-internal declarations (intrinsics, a template's own
 * members, interfaces extended from a library) resolve to nothing.
 */
export function findUsageSite(
  program: Program,
  target: DiagnosticTarget,
  kinds: readonly UsageSiteKind[] = allKinds,
): UsageSite | undefined {
  if (typeof target !== "object" || !("kind" in target) || typeof target.kind !== "string") {
    return undefined;
  }
  const type = target as Type;
  if (type.kind !== "ModelProperty") return undefined;

  const origins = getOrigins(type);
  return (
    (kinds.includes("argument") ? findArgument(program, type, origins) : undefined) ??
    (kinds.includes("composition") ? findComposition(program, type, origins) : undefined)
  );
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
  for (const mapper of getMappers(origins)) {
    const reference = mapper.source.node;
    if (reference.kind !== SyntaxKind.TypeReference || !isInProject(program, reference)) {
      continue;
    }
    const written = (reference as TypeReferenceNode).arguments;
    for (let i = 0; i < written.length; i++) {
      const arg = mapper.args[i];
      if (!arg || !("kind" in arg) || typeof arg.kind !== "string") continue;
      const node = written[i].argument;
      // A type the user cannot edit and that this property is built from.
      if (!isUserOwned(program, arg as Type) && contains(prop.type, arg as Type)) {
        return { kind: "argument", node };
      }
      // An expression the user wrote (e.g. `A & B`) that this property was copied through.
      if (isComposedFrom(arg as Type, origins)) {
        return { kind: "composition", node: narrowToOperand(program, node, origins) };
      }
    }
  }
  return undefined;
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
    try {
      if (sources.has(program.checker.getTypeForNode(candidate))) {
        return { kind: "composition", node: candidate };
      }
    } catch {
      // Reference could not be resolved again; ignore.
    }
  }
  return undefined;
}

/** For `A & B & C`, the operand the property came from rather than the whole expression. */
function narrowToOperand(program: Program, node: Node, origins: ModelProperty[]): Node {
  if (node.kind !== SyntaxKind.IntersectionExpression) return node;
  for (const operand of node.options) {
    try {
      if (isComposedFrom(program.checker.getTypeForNode(operand), origins)) return operand;
    } catch {
      // Operand could not be resolved again; keep the whole expression.
    }
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

/** Whether the type is declared in the project (or is a collection of such types). */
function isUserOwned(program: Program, type: Type, depth = 0): boolean {
  if (depth > 4) return false;
  if (type.kind === "Model" && type.indexer) {
    return isUserOwned(program, type.indexer.value, depth + 1);
  }
  if (type.kind === "Union" && !type.name) {
    return [...type.variants.values()].some((v) => isUserOwned(program, v.type, depth + 1));
  }
  return "node" in type && !!type.node && isInProject(program, type);
}

function contains(type: Type, needle: Type, depth = 0): boolean {
  if (type === needle) return true;
  if (depth > 4) return false;
  if (type.kind === "Model" && type.indexer) return contains(type.indexer.value, needle, depth + 1);
  if (type.kind === "Union") {
    return [...type.variants.values()].some((v) => contains(v.type, needle, depth + 1));
  }
  return false;
}
