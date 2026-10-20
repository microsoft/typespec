import type { BooleanLiteral, MemberType, NumericLiteral, StringLiteral } from "@typespec/compiler";
import type { CustomMutationClasses, MutationEngine, MutationOptions } from "./mutation-engine.js";
import { Mutation, type MutationInfo } from "./mutation.js";

/** Leaf strategy shared by string, numeric, and boolean literals. */
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
  /** Groups literal strategies regardless of the source's primitive literal kind. */
  readonly kind = "Literal";

  /** Initializes a literal strategy without constructing a mutation node. */
  constructor(
    engine: TEngine,
    sourceType: StringLiteral | NumericLiteral | BooleanLiteral,
    referenceTypes: MemberType[],
    options: TOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
  }

  /** Performs no traversal or transformation by default; literals have no child strategies. */
  mutate() {
    // No mutations needed for literal types
  }
}
