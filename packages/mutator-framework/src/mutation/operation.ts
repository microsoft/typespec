import type { MemberType, Operation, Type } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationHalfEdge,
  MutationOptions,
} from "./mutation-engine.js";
import { Mutation, type MutationInfo } from "./mutation.js";

export abstract class OperationMutation<
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
    referenceTypes: MemberType[],
    options: TOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
  }

  protected mutateParameters() {
    this.parameters = this.engine.mutate(
      this.sourceType.parameters,
      this.options,
      this.startParametersEdge(),
    );
  }

  protected mutateReturnType() {
    this.returnType = this.engine.mutate(
      this.sourceType.returnType,
      this.options,
      this.startReturnTypeEdge(),
    );
  }

  protected abstract startParametersEdge(): MutationHalfEdge;
  protected abstract startReturnTypeEdge(): MutationHalfEdge;

  mutate() {
    this.mutateParameters();
    this.mutateReturnType();
  }
}
