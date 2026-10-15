import { type ComponentContext, createNamedContext, useContext } from "@alloy-js/core";
import type { Program } from "@typespec/compiler";
import { $, type Typekit } from "@typespec/compiler/typekit";

/** Program and program-bound typekit available while rendering TypeSpec-aware components. */
export type TspContext = {
  /** Program being emitted; all typekit queries in this context use this program. */
  program: Program;
  /** Shared typekit, initialized lazily by {@link useTsp} if the provider omitted it. */
  $: Typekit;
};

/**
 * Supplies the program for a component subtree. {@link Output} installs this provider.
 * A custom provider may supply a typekit; otherwise {@link useTsp} creates and caches one.
 */
export const TspContext: ComponentContext<{ program: Program; $?: Typekit }> = createNamedContext<{
  /** Program whose types the subtree renders. */
  program: Program;
  /** Optional preconfigured typekit; omission defers creation until the first {@link useTsp} call. */
  $?: Typekit;
}>("TspContext");

/**
 * Gets the nearest TypeSpec context, ensuring it has a program-bound typekit.
 * Must run within an Alloy render under {@link Output} or a {@link TspContext} provider.
 * Throws when no provider is available.
 */
export function useTsp() {
  const context = useContext(TspContext)!;

  if (!context) {
    throw new Error(
      "TspContext is not set. Make sure the component is wrapped in TspContext.Provider or the emitter framework Output component.",
    );
  }

  if (!context.$) {
    context.$ = $(context.program);
  }

  return context as TspContext;
}
