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
 * Check if a decorator application matches the given scope.
 * A decorator matches if:
 * - It has no `when` conditions (unconditional), OR
 * - All of its `when` conditions are satisfied by the scope
 *
 * @param decorator The decorator application to check
 * @param scope The emitter scope to match against
 * @returns true if the decorator is active in the given scope
 */
export function decoratorMatchesScope(
  decorator: DecoratorApplication,
  scope: EmitterScope,
): boolean {
  if (!decorator.when || decorator.when.length === 0) {
    return true; // Unconditional decorator always matches
  }

  // All conditions must match (AND semantics)
  return decorator.when.every((condition) => conditionMatchesScope(condition, scope));
}

/**
 * Check if a single when condition matches the given scope.
 */
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
      // Version-based conditions require version projection (mutator-based)
      // For POC, these always match (would need version context)
      return true;
    case "member":
      // Enum member conditions require visibility context
      // For POC, these always match (would need visibility filter)
      return true;
    default:
      return true;
  }
}

/**
 * Filter a type's decorators by scope, returning only those that are active.
 *
 * @param type The type whose decorators to filter
 * @param scope The emitter scope
 * @returns Decorators that are unconditional or match the scope
 */
export function getDecoratorsByScope(
  type: Type & { decorators: DecoratorApplication[] },
  scope: EmitterScope,
): DecoratorApplication[] {
  return type.decorators.filter((d) => decoratorMatchesScope(d, scope));
}

/**
 * Get the first decorator matching a specific name that's active in the scope.
 *
 * @param type The type to query
 * @param decoratorName The decorator function or namespace-qualified name
 * @param scope The emitter scope
 * @returns The matching decorator application, or undefined
 */
export function getScopedDecorator(
  type: Type & { decorators: DecoratorApplication[] },
  decoratorFn: Function,
  scope: EmitterScope,
): DecoratorApplication | undefined {
  return type.decorators.find(
    (d) => d.decorator === decoratorFn && decoratorMatchesScope(d, scope),
  );
}

/**
 * Create an emitter scope from configuration.
 * Used by emitters in their `$onEmit` function.
 */
export function createEmitterScope(options: EmitterScope): EmitterScope {
  return { ...options };
}
