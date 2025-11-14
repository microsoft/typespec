import type { Program } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { MutationEngine, MutationSubgraph } from "../src/index.js";

export function getSubgraph(program: Program) {
  const tk = $(program);
  const engine = new MutationEngine(tk, {});
  return new MutationSubgraph(engine);
}
