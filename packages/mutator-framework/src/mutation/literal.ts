import type { BooleanLiteral, MemberType, NumericLiteral, StringLiteral } from "@typespec/compiler";
import type { CustomMutationClasses, MutationEngine, MutationOptions } from "./mutation-engine.js";
import { Mutation } from "./mutation.js";

export class LiteralMutation<
  TOptions extends MutationOptions,
  TCustomMutations extends CustomMutationClasses,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends Mutation<
  StringLiteral | NumericLiteral | BooleanLiteral,
  TCustomMutations,
  TOptions,
  TEngine
> {
  readonly kind = "Literal";

  constructor(
    engine: TEngine,
    sourceType: StringLiteral | NumericLiteral | BooleanLiteral,
    referenceTypes: MemberType[] = [],
    options: TOptions,
  ) {
    super(engine, sourceType, referenceTypes, options);
  }

  mutate() {
    // No mutations needed for literal types
  }
}
