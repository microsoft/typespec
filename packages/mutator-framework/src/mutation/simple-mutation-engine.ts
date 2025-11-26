import type { Typekit } from "@typespec/compiler/typekit";
import type { MutationSubgraph } from "../mutation-node/mutation-subgraph.js";
import {
  type ConstructorsFor,
  type CustomMutationClasses,
  MutationEngine,
  MutationOptions,
} from "./mutation-engine.js";

export class SimpleMutationEngine<
  TCustomMutations extends CustomMutationClasses,
> extends MutationEngine<TCustomMutations> {
  constructor($: Typekit, mutatorClasses: ConstructorsFor<TCustomMutations>) {
    super($, mutatorClasses);
    this.registerSubgraph("subgraph");
  }

  getDefaultMutationSubgraph(options: MutationOptions): MutationSubgraph {
    return super.getMutationSubgraph(options, "subgraph");
  }
}
