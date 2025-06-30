import { type ComponentContext, createNamedContext, useContext } from "@alloy-js/core";
import type { Program } from "@typespec/compiler";
import { $, type Typekit } from "@typespec/compiler/typekit";

export type TspContext = {
  program: Program;
  $: Typekit;
};

export const TspContext: ComponentContext<{ program: Program; $?: Typekit }> = createNamedContext<{
  program: Program;
  $?: Typekit;
}>("TspContext");

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
