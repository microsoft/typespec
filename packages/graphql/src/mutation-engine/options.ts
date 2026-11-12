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
 * @param inputQualifier - when set, feeds the naming pipeline without changing the cache key
 *   (e.g., "Query" → UserQueryInput, "Mutation" → UserMutationInput)
 */
export class GraphQLMutationOptions extends SimpleMutationOptions {
  /** Structural variant propagated to referenced types: input object, output object, or interface. */
  readonly typeContext: GraphQLTypeContext;
  /** Property-selection filter; undefined leaves model properties unfiltered. */
  readonly visibilityFilter?: VisibilityFilter;
  /** Optional cache discriminator, conventionally "query" or "mutation" for input variants. */
  readonly operationKind?: string;
  /** Naming qualifier — only set when operation variance requires distinct type names. */
  readonly inputQualifier?: string;

  /**
   * Selects a structural variant and optional property filter. Callers must
   * supply consistent filters and naming qualifiers for the same cache key:
   * only `typeContext` and `operationKind` contribute to {@link mutationKey}.
   */
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

  /**
   * Cache discriminator consisting of the context and, when truthy, operation
   * kind separated by a hyphen. Filters and naming qualifiers are not included.
   */
  override get mutationKey(): string {
    if (this.operationKind) {
      return `${this.typeContext}-${this.operationKind}`;
    }
    return this.typeContext;
  }
}
