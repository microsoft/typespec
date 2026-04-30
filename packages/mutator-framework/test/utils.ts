import type { Program } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { MutationEngine } from "../src/index.js";

export function getEngine(program: Program) {
  const tk = $(program);
  return new MutationEngine(tk, {});
}
