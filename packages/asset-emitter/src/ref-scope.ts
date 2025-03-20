import type { Declaration, Scope } from "./types.js";

export function scopeChain<T>(scope: Scope<T> | null) {
  const chain = [];
  while (scope) {
    chain.unshift(scope);
    scope = scope.parentScope;
  }

  return chain;
}

/**
 * Resolve relative scopes between the current scope and the target declaration.
 * @param target The target declaration
 * @param currentScope Current scope
 * @returns
 */
export function resolveDeclarationReferenceScope<T>(
  target: Declaration<T>,
  currentScope: Scope<T>,
) {
  const targetScope = target.scope;
  const targetChain = scopeChain(targetScope);
  const currentChain = scopeChain(currentScope);
  let diffStart = 0;
  while (
    targetChain[diffStart] &&
    currentChain[diffStart] &&
    targetChain[diffStart] === currentChain[diffStart]
  ) {
    diffStart++;
  }

  const pathUp: Scope<T>[] = currentChain.slice(diffStart);
  const pathDown: Scope<T>[] = targetChain.slice(diffStart);

  const commonScope = targetChain[diffStart - 1] ?? null;
  return { pathUp, pathDown, commonScope };
}
