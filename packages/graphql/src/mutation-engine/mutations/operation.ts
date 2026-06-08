import type { MemberType, Operation } from "@typespec/compiler";
import {
  SimpleOperationMutation,
  type MutationInfo,
  type SimpleMutationEngine,
  type SimpleMutationOptions,
  type SimpleMutations,
} from "@typespec/mutator-framework";
import { applyFieldNamePipeline } from "../../lib/naming.js";
import { setNullable } from "../../lib/nullable.js";
import { isNullableUnion } from "../../lib/type-utils.js";
import { GraphQLMutationOptions, GraphQLTypeContext } from "../options.js";

/** GraphQL-specific Operation mutation. */
export class GraphQLOperationMutation extends SimpleOperationMutation<SimpleMutationOptions> {
  constructor(
    engine: SimpleMutationEngine<SimpleMutations<SimpleMutationOptions>>,
    sourceType: Operation,
    referenceTypes: MemberType[],
    options: SimpleMutationOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
  }

  /** Mutate parameters with input context. */
  protected override mutateParameters() {
    const inputOptions = new GraphQLMutationOptions(GraphQLTypeContext.Input);
    this.parameters = this.engine.mutate(
      this.sourceType.parameters,
      inputOptions,
      this.startParametersEdge(),
    );
  }

  /** Mutate return type with output context. */
  protected override mutateReturnType() {
    const outputOptions = new GraphQLMutationOptions(GraphQLTypeContext.Output);
    this.returnType = this.engine.mutate(
      this.sourceType.returnType,
      outputOptions,
      this.startReturnTypeEdge(),
    );
  }

  mutate() {
    // Snapshot return-type nullability before mutation replaces it.
    const hasNullableReturn = isNullableUnion(this.sourceType.returnType);

    this.mutationNode.mutate((operation) => {
      operation.name = applyFieldNamePipeline(operation.name);
    });
    super.mutate();

    if (hasNullableReturn) {
      setNullable(this.engine.$.program, this.mutatedType);
    }
  }
}
