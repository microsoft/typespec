import type { VisibilityFilter } from "@typespec/compiler";
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
  /** Model marked with @interface — emits as a GraphQL interface declaration */
  Interface = "interface",
}

/**
 * Mutation options that carry input/output context and visibility through the type graph.
 * The mutationKey ensures the framework caches variants separately.
 *
 * @param typeContext - structural context (Input/Output/Interface)
 * @param visibilityFilter - which properties to include (from compiler's VisibilityFilter)
 * @param inputQualifier - when set, distinguishes cache entries and feeds the naming pipeline
 *   (e.g., "Query" → UserQueryInput, "Mutation" → UserMutationInput)
 */
export class GraphQLMutationOptions extends SimpleMutationOptions {
  readonly typeContext: GraphQLTypeContext;
  readonly visibilityFilter?: VisibilityFilter;
  /** Cache key discriminator — always set for input variants ("query" or "mutation"). */
  readonly operationKind?: string;
  /** Naming qualifier — only set when operation variance requires distinct type names. */
  readonly inputQualifier?: string;

  constructor(
    typeContext: GraphQLTypeContext,
    visibilityFilter?: VisibilityFilter,
    operationKind?: string,
    inputQualifier?: string,
  ) {
    super();
    this.typeContext = typeContext;
    this.visibilityFilter = visibilityFilter;
    this.operationKind = operationKind;
    this.inputQualifier = inputQualifier;
  }

  override get mutationKey(): string {
    if (this.operationKind) {
      return `${this.typeContext}-${this.operationKind}`;
    }
    return this.typeContext;
  }
}
