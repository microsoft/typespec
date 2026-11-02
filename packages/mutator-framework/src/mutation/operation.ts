import type { MemberType, Operation, Type } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationHalfEdge,
  MutationOptions,
} from "./mutation-engine.js";
import { Mutation, type MutationInfo } from "./mutation.js";

/**
 * Traverses an operation's parameter model followed by its return type.
 * Subclasses supply the output connections; the containing interface is not
 * traversed by this strategy.
 */
export abstract class OperationMutation<
  TOptions extends MutationOptions,
  TCustomMutations extends CustomMutationClasses,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends Mutation<Operation, TCustomMutations, TOptions, TEngine> {
  /** Strategy discriminator; replacing output nodes does not change this value. */
  readonly kind = "Operation";
  /** Parameter model strategy, assigned when traversal reaches the parameters. */
  parameters!: MutationFor<TCustomMutations, "Model">;
  /** Result strategy, assigned when traversal reaches the return type. */
  returnType!: MutationFor<TCustomMutations, Type["kind"]>;

  /** Initializes traversal of an operation with the engine's selected metadata. */
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

  /** Resolves and connects the source parameters and return type using this strategy's options. */
  mutate() {
    this.mutateParameters();
    this.mutateReturnType();
  }
}
