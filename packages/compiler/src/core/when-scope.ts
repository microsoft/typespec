import { applyDecoratorToType } from "./checker.js";
import type { Program } from "./program.js";
import { navigateProgram } from "./semantic-walker.js";
import type { DecoratorApplication, Type, WhenCondition } from "./types.js";

/**
 * An emitter scope defines the context for filtering scoped decorators.
 * Emitters create a scope to query metadata that's conditioned with `when` clauses.
 */
export interface EmitterScope {
  /** The emitter package name (e.g., "@typespec/http-client-csharp") */
  readonly emitter?: string;
  /** The target language (e.g., "csharp", "python", "java") */
  readonly language?: string;
  /** The emitter kind (e.g., "client", "server") */
  readonly target?: string;
}

/**
 * Scope filter constructors for use with `applyScopes`.
 */
export function emitter(name: string): EmitterScope {
  return { emitter: name };
}

export function language(name: string): EmitterScope {
  return { language: name };
}

export function target(name: string): EmitterScope {
  return { target: name };
}

/**
 * Create a scoped view of a program by applying the given scopes.
 * Returns a Program with isolated state maps where matching scoped decorators
 * have been executed.
 *
 * Usage in an emitter:
 * ```ts
 * export async function $onEmit(context: EmitContext) {
 *   const scopedProgram = applyScopes(context.program, [emitter("@typespec/openapi3")]);
 *   // getDoc(scopedProgram, type) now returns scope-appropriate values
 * }
 * ```
 *
 * @param program The base program
 * @param scopes The scopes to apply (merged into a single scope for matching)
 * @returns A Program-compatible object with isolated state
 */
export function applyScopes(program: Program, scopes: EmitterScope[]): Program {
  // Merge all scope filters into one
  const mergedScope = mergeScopes(scopes);

  // Clone state maps for isolation
  const clonedStateMaps = new Map<symbol, Map<Type, unknown>>();
  for (const [key, map] of program.stateMaps) {
    clonedStateMaps.set(key, new Map(map));
  }
  const clonedStateSets = new Map<symbol, Set<Type>>();
  for (const [key, set] of program.stateSets) {
    clonedStateSets.set(key, new Set(set));
  }

  // Create the scoped program proxy
  const scopedProgram: Program = Object.create(program);
  scopedProgram.stateMaps = clonedStateMaps;
  scopedProgram.stateSets = clonedStateSets;
  scopedProgram.stateMap = function (key: symbol): Map<Type, any> {
    let map = clonedStateMaps.get(key);
    if (!map) {
      map = new Map();
      clonedStateMaps.set(key, map);
    }
    return map;
  };
  scopedProgram.stateSet = function (key: symbol): Set<Type> {
    let set = clonedStateSets.get(key);
    if (!set) {
      set = new Set();
      clonedStateSets.set(key, set);
    }
    return set;
  };

  // Walk all types and execute matching scoped decorators
  navigateProgram(program, {
    model(model) {
      executeMatchingScopedDecorators(scopedProgram, model, mergedScope);
    },
    modelProperty(prop) {
      executeMatchingScopedDecorators(scopedProgram, prop, mergedScope);
    },
    operation(op) {
      executeMatchingScopedDecorators(scopedProgram, op, mergedScope);
    },
    interface(iface) {
      executeMatchingScopedDecorators(scopedProgram, iface, mergedScope);
    },
    enum(en) {
      executeMatchingScopedDecorators(scopedProgram, en, mergedScope);
    },
    enumMember(member) {
      executeMatchingScopedDecorators(scopedProgram, member, mergedScope);
    },
    union(u) {
      executeMatchingScopedDecorators(scopedProgram, u, mergedScope);
    },
    unionVariant(v) {
      executeMatchingScopedDecorators(scopedProgram, v, mergedScope);
    },
    scalar(s) {
      executeMatchingScopedDecorators(scopedProgram, s, mergedScope);
    },
    namespace(ns) {
      executeMatchingScopedDecorators(scopedProgram, ns, mergedScope);
    },
  });

  return scopedProgram;
}

/**
 * Execute scoped decorators on a type that match the given scope.
 */
function executeMatchingScopedDecorators(
  scopedProgram: Program,
  type: Type & { decorators: DecoratorApplication[] },
  scope: EmitterScope,
): void {
  for (const decApp of type.decorators) {
    if (!decApp.when) continue;
    if (!decoratorMatchesScope(decApp, scope)) continue;
    applyDecoratorToType(scopedProgram, decApp, type);
  }
}

/**
 * Merge multiple scope filters into one (union of all constraints).
 */
function mergeScopes(scopes: EmitterScope[]): EmitterScope {
  if (scopes.length === 1) return scopes[0];
  const merged: EmitterScope = {};
  for (const s of scopes) {
    if (s.emitter) (merged as any).emitter = s.emitter;
    if (s.language) (merged as any).language = s.language;
    if (s.target) (merged as any).target = s.target;
  }
  return merged;
}

/**
 * Check if a decorator application matches the given scope.
 */
export function decoratorMatchesScope(
  decorator: DecoratorApplication,
  scope: EmitterScope,
): boolean {
  if (!decorator.when || decorator.when.length === 0) {
    return true;
  }
  return decorator.when.every((condition) => conditionMatchesScope(condition, scope));
}

function conditionMatchesScope(condition: WhenCondition, scope: EmitterScope): boolean {
  switch (condition.kind) {
    case "emitter":
      if (!scope.emitter || !condition.rawArgs) return false;
      return condition.rawArgs.includes(scope.emitter);
    case "language":
      if (!scope.language || !condition.rawArgs) return false;
      return condition.rawArgs.includes(scope.language);
    case "target":
      if (!scope.target || !condition.rawArgs) return false;
      return condition.rawArgs.includes(scope.target);
    case "since":
    case "between":
      return true;
    case "member":
      return true;
    default:
      return true;
  }
}

/**
 * Filter a type's decorators by scope.
 */
export function getDecoratorsByScope(
  type: Type & { decorators: DecoratorApplication[] },
  scope: EmitterScope,
): DecoratorApplication[] {
  return type.decorators.filter((d) => decoratorMatchesScope(d, scope));
}

/**
 * Create an emitter scope from configuration.
 */
export function createEmitterScope(options: EmitterScope): EmitterScope {
  return { ...options };
}
