import { SimpleMutationOptions } from "@typespec/mutator-framework";

/**
 * Context for how a type is used in GraphQL operations.
 * Determines whether a model becomes an object type (output) or input type (input).
 */
export enum GraphQLTypeContext {
  /** Type reachable from operation parameters */
  Input = "input",
  /** Type reachable from operation return types */
  Output = "output",
  /** Model marked with @Interface — emits as a GraphQL interface declaration */
  Interface = "interface",
}

/**
 * Mutation options that carry input/output context through the type graph.
 * The mutationKey ensures the framework caches input and output variants
 * separately for the same source type.
 */
export class GraphQLMutationOptions extends SimpleMutationOptions {
  readonly typeContext: GraphQLTypeContext;

  constructor(typeContext: GraphQLTypeContext) {
    super();
    this.typeContext = typeContext;
  }

  override get mutationKey(): string {
    return this.typeContext;
  }
}
