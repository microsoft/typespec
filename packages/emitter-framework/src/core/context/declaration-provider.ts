import { DeclarationProvider } from "#core/declaration-provider.js";
import { type ComponentContext, createNamedContext, useContext } from "@alloy-js/core";
import type { Typekit } from "@typespec/compiler/typekit";
import { useTsp } from "./tsp-context.js";

/**
 * Provides the declaration provider that is used to get refkeys for
 * declarations and determine if a type should be declared or referenced.
 */
export const DeclarationProviderContext: ComponentContext<DeclarationProvider> =
  createNamedContext<DeclarationProvider>("DeclarationProviderContext");

export function useDeclarationProvider(): DeclarationProvider {
  return useContext(DeclarationProviderContext) ?? getDefaultDeclarationProvider(useTsp().$);
}

const knownDeclarationProviders = new WeakMap<Typekit, DeclarationProvider>();
function getDefaultDeclarationProvider($: Typekit) {
  let provider = knownDeclarationProviders.get($);
  if (!provider) {
    provider = new DeclarationProvider($);
    knownDeclarationProviders.set($, provider);
  }
  return provider;
}
