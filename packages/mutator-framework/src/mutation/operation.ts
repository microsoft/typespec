import type { MemberType, Operation, Type } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationOptions,
} from "./mutation-engine.js";
import { Mutation } from "./mutation.js";

export class OperationMutation<
  TOptions extends MutationOptions,
  TCustomMutations extends CustomMutationClasses,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends Mutation<Operation, TCustomMutations, TOptions, TEngine> {
  readonly kind = "Operation";
  parameters!: MutationFor<TCustomMutations, "Model">;
  returnType!: MutationFor<TCustomMutations, Type["kind"]>;

  constructor(
    engine: TEngine,
    sourceType: Operation,
    referenceTypes: MemberType[] = [],
    options: TOptions,
  ) {
    super(engine, sourceType, referenceTypes, options);
  }

  protected mutateParameters() {
    this.parameters = this.engine.mutate(this.sourceType.parameters, this.options);
  }

  protected mutateReturnType() {
    this.returnType = this.engine.mutate(this.sourceType.returnType, this.options);
  }

  mutate() {
    this.mutateParameters();
    this.mutateReturnType();
  }
}
