import { ComponentContext, createNamedContext, useContext } from "@alloy-js/core";
import { Program } from "@typespec/compiler";
import { unsafe_$ } from "@typespec/compiler/experimental";
import { Typekit } from "@typespec/compiler/experimental/typekit";

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

  if (!context.$) {
    context.$ = unsafe_$(context.program);
  }

  return context as TspContext;
}
