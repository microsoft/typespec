import { ComponentContext, createNamedContext, useContext } from "@alloy-js/core";
import { Typekit } from "@typespec/compiler/experimental/typekit";

export const TypekitContext: ComponentContext<{ $: Typekit }> = createNamedContext<{ $: Typekit }>(
  "TypekitContext",
);

export function useTypekit() {
  return useContext(TypekitContext)!;
}
