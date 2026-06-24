import { isArrayModelType, type MemberType, type Operation } from "@typespec/compiler";
import {
  SimpleOperationMutation,
  type MutationInfo,
  type SimpleMutationEngine,
  type SimpleMutationOptions,
  type SimpleMutations,
} from "@typespec/mutator-framework";
import { applyFieldNamePipeline } from "../../lib/naming.js";
import { setNullable, setNullableElements } from "../../lib/nullable.js";
import { isNullableUnion, unwrapNullableUnion } from "../../lib/type-utils.js";
import { getOperationKind } from "../../lib/operation-kind.js";
import { createVisibilityFilters } from "../../lib/visibility.js";
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

  /** Mutate parameters with input context and operation-kind-aware visibility. */
  protected override mutateParameters() {
    const program = this.engine.$.program;
    const kind = getOperationKind(program, this.sourceType);
    const filters = createVisibilityFilters(program);
    const isQuery = kind === "Query" || kind === "Subscription";
    const visibilityFilter = isQuery ? filters.query : filters.mutation;
    const opKind = isQuery ? "query" : "mutation";
    const inputOptions = new GraphQLMutationOptions(
      GraphQLTypeContext.Input, visibilityFilter, opKind,
    );
    this.parameters = this.engine.mutate(
      this.sourceType.parameters,
      inputOptions,
      this.startParametersEdge(),
    );
  }

  /** Mutate return type with output context. */
  protected override mutateReturnType() {
    const program = this.engine.$.program;
    const filters = createVisibilityFilters(program);
    const outputOptions = new GraphQLMutationOptions(GraphQLTypeContext.Output, filters.output);
    this.returnType = this.engine.mutate(
      this.sourceType.returnType,
      outputOptions,
      this.startReturnTypeEdge(),
    );
  }

  mutate() {
    // Snapshot return-type nullability before mutation replaces it.
    const returnType = this.sourceType.returnType;
    const hasNullableReturn = isNullableUnion(returnType);

    // For element nullability, look through an outer `| null` wrapper to find the array.
    // e.g. `(string | null)[] | null` → unwrap outer null → check array elements.
    const innerReturnType =
      returnType.kind === "Union" ? (unwrapNullableUnion(returnType) ?? returnType) : returnType;

    const hasNullableElements =
      innerReturnType.kind === "Model" &&
      isArrayModelType(innerReturnType) &&
      isNullableUnion(innerReturnType.indexer.value);

    this.mutationNode.mutate((operation) => {
      const iface = this.sourceType.interface;
      const rawName = iface ? `${iface.name}_${operation.name}` : operation.name;
      operation.name = applyFieldNamePipeline(rawName);
    });
    super.mutate();

    // Remove parameters whose type was visibility-filtered to an empty model.
    for (const [name, param] of this.mutatedType.parameters.properties) {
      if (param.type.kind === "Model" && !isArrayModelType(param.type) && param.type.properties.size === 0) {
        this.mutatedType.parameters.properties.delete(name);
      }
    }

    if (hasNullableReturn) {
      setNullable(this.mutatedType);
    }
    if (hasNullableElements) {
      setNullableElements(this.mutatedType);
    }
  }
}
