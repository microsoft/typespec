import {
  type Enum,
  type Model,
  type Operation,
  type Program,
  type Scalar,
  type Union,
  type VisibilityFilter,
} from "@typespec/compiler";

import { $ } from "@typespec/compiler/typekit";
import {
  MutationEngine,
  SimpleInterfaceMutation,
  SimpleIntrinsicMutation,
  SimpleLiteralMutation,
  SimpleMutationOptions,
  SimpleUnionVariantMutation,
} from "@typespec/mutator-framework";
import {
  GraphQLEnumMemberMutation,
  GraphQLEnumMutation,
  GraphQLModelMutation,
  GraphQLModelPropertyMutation,
  GraphQLOperationMutation,
  GraphQLScalarMutation,
  GraphQLUnionMutation,
} from "./mutations/index.js";
import { GraphQLMutationOptions, GraphQLTypeContext } from "./options.js";

/**
 * Registry configuration for the GraphQL mutation engine.
 * Maps TypeSpec type kinds to their corresponding GraphQL mutation classes.
 */
const graphqlMutationRegistry = {
  // Custom GraphQL mutations for types we need to transform
  Enum: GraphQLEnumMutation,
  EnumMember: GraphQLEnumMemberMutation,
  Model: GraphQLModelMutation,
  ModelProperty: GraphQLModelPropertyMutation,
  Operation: GraphQLOperationMutation,
  Scalar: GraphQLScalarMutation,
  Union: GraphQLUnionMutation,
  // Use Simple* classes from mutator-framework for types we don't customize
  Interface: SimpleInterfaceMutation,
  UnionVariant: SimpleUnionVariantMutation,
  String: SimpleLiteralMutation,
  Number: SimpleLiteralMutation,
  Boolean: SimpleLiteralMutation,
  Intrinsic: SimpleIntrinsicMutation,
};

/**
 * GraphQL mutation engine that applies GraphQL-specific transformations
 * to TypeSpec types, such as name sanitization, scalar mapping, and
 * input/output type splitting via mutation keys.
 *
 * When an operation is mutated, parameters are automatically mutated with
 * input context and return types with output context. The mutation framework's
 * cache ensures each (type, context) pair produces a separate mutation.
 */
export class GraphQLMutationEngine {
  // Type is inferred from the MutationEngine constructor. Explicitly typing as
  // MutationEngine<typeof graphqlMutationRegistry> doesn't work because the
  // generic expects instance types, not constructor types.
  private engine;

  constructor(program: Program) {
    const tk = $(program);
    this.engine = new MutationEngine(tk, graphqlMutationRegistry);
  }

  /**
   * Mutate a model with explicit input/output context and optional visibility filter.
   * Models mutated with different contexts produce separate cached mutations,
   * allowing the same source model to have both an input and output variant.
   */
  mutateModel(
    model: Model,
    context: GraphQLTypeContext,
    visibilityFilter?: VisibilityFilter,
    operationKind?: string,
    inputQualifier?: string,
  ): GraphQLModelMutation {
    return this.engine.mutate(
      model,
      new GraphQLMutationOptions(context, visibilityFilter, operationKind, inputQualifier),
    ) as GraphQLModelMutation;
  }

  /**
   * Mutate an enum, applying GraphQL name sanitization.
   */
  mutateEnum(enumType: Enum): GraphQLEnumMutation {
    return this.engine.mutate(enumType, new SimpleMutationOptions()) as GraphQLEnumMutation;
  }

  /**
   * Mutate an operation, applying GraphQL name sanitization.
   * Parameters are automatically mutated with input context,
   * return types with output context.
   */
  mutateOperation(operation: Operation): GraphQLOperationMutation {
    return this.engine.mutate(operation, new SimpleMutationOptions()) as GraphQLOperationMutation;
  }

  /**
   * Mutate a scalar, applying GraphQL name sanitization.
   */
  mutateScalar(scalar: Scalar): GraphQLScalarMutation {
    return this.engine.mutate(scalar, new SimpleMutationOptions()) as GraphQLScalarMutation;
  }

  /**
   * Mutate a union with explicit input/output context.
   * In output context: creates wrapper types for scalar variants. mutatedType is a Union.
   * In input context: replaces the union with a @oneOf input Model in the type graph,
   *   since GraphQL unions are output-only. mutatedType is a Model.
   */
  mutateUnion(
    union: Union,
    context: GraphQLTypeContext,
    visibilityFilter?: VisibilityFilter,
    operationKind?: string,
  ): GraphQLUnionMutation {
    return this.engine.mutate(
      union,
      new GraphQLMutationOptions(context, visibilityFilter, operationKind),
    ) as GraphQLUnionMutation;
  }
}

/**
 * Creates a GraphQL mutation engine for the given program.
 */
export function createGraphQLMutationEngine(program: Program): GraphQLMutationEngine {
  return new GraphQLMutationEngine(program);
}
