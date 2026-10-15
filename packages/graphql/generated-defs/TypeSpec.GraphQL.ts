import {
  type DecoratorContext,
  type DecoratorValidatorCallbacks,
  hasAutoDecorator,
  type Interface,
  type Model,
  type ModelProperty,
  type Namespace,
  type Operation,
  type Program,
  type Scalar,
  setAutoDecorator,
  type Union,
} from "@typespec/compiler";

export interface SchemaOptions {
  readonly name?: string;
}

/**
 * Mark this model as a GraphQL Interface. Interfaces can be implemented by other models
 * using the `@compose` decorator.
 *
 * @param options .interfaceOnly When true, the model will only be emitted as an interface
 * (no "Interface" suffix is added to the name). Use this for abstract interfaces that
 * will never be used directly as output/input types (e.g., Node, Connection). Defaults to false.
 * @example
 * ```typespec
 * @graphqlInterface(#{ interfaceOnly: true })
 * model Node {
 *   id: string;
 * }
 *
 * @compose(Node)
 * model User {
 *   ...Node;
 *   name: string;
 * }
 * // Emits: interface Node { id: String! }
 * //        type User implements Node { id: String!; name: String! }
 * ```
 */
export type GraphqlInterfaceDecorator = (
  context: DecoratorContext,
  target: Model,
  options?: {
    readonly interfaceOnly?: boolean;
  },
) => DecoratorValidatorCallbacks | void;

/**
 * Specify the GraphQL interfaces that should be implemented by a model.
 * The interfaces must be decorated with the `@graphqlInterface` decorator,
 * and all of the interfaces' properties must be present and compatible.
 *
 * @example
 * ```typespec
 * @graphqlInterface(#{ interfaceOnly: true })
 * model Node {
 *   id: string;
 * }
 *
 * @compose(Node)
 * model User {
 *   ...Node;
 *   name: string;
 * }
 * ```
 * @param interfaces The models to compose into the target, each emitted as a GraphQL interface.
 */
export type ComposeDecorator = (
  context: DecoratorContext,
  target: Model,
  ...interfaces: Model[]
) => DecoratorValidatorCallbacks | void;

/**
 * Assign one or more operations or interfaces to act as fields with arguments on a model.
 * The operations become fields on the GraphQL type with their parameters as arguments.
 *
 * @example
 * ```typespec
 * op followers(query: string): Person[];
 *
 * @operationFields(followers)
 * model Person {
 *   name: string;
 * }
 * // Emits: type Person { name: String!; followers(query: String!): [Person!]! }
 * ```
 * @param operations The operations, or interfaces of operations, to add to the target as fields.
 */
export type OperationFieldsDecorator = (
  context: DecoratorContext,
  target: Model,
  ...operations: (Operation | Interface)[]
) => DecoratorValidatorCallbacks | void;

/**
 * Specify the GraphQL Operation kind for the target operation to be `MUTATION`.
 *
 * @example
 * ```typespec
 * @mutation op createUser(name: string): User;
 * ```
 */
export type MutationDecorator = (
  context: DecoratorContext,
  target: Operation,
) => DecoratorValidatorCallbacks | void;

/**
 * Specify the GraphQL Operation kind for the target operation to be `QUERY`.
 *
 * @example
 * ```typespec
 * @query op getUser(id: string): User;
 * ```
 */
export type QueryDecorator = (
  context: DecoratorContext,
  target: Operation,
) => DecoratorValidatorCallbacks | void;

/**
 * Specify the GraphQL Operation kind for the target operation to be `SUBSCRIPTION`.
 *
 * @example
 * ```typespec
 * @subscription op onUserCreated(): User;
 * ```
 */
export type SubscriptionDecorator = (
  context: DecoratorContext,
  target: Operation,
) => DecoratorValidatorCallbacks | void;

/**
 * Mark this namespace as describing a GraphQL schema and configure schema properties.
 * All types and operations within the namespace will be emitted to a single GraphQL schema file.
 *
 * @example
 * ```typespec
 * @schema(#{ name: "MyAPI" })
 * namespace MyAPI {
 *   model User { id: string; name: string; }
 *   @query op getUser(id: string): User;
 * }
 * // Emits: MyAPI.graphql
 * ```
 * @param options Options for the schema, such as its name.
 */
export type SchemaDecorator = (
  context: DecoratorContext,
  target: Namespace,
  options?: SchemaOptions,
) => DecoratorValidatorCallbacks | void;

/**
 * Provide a specification URL for a custom GraphQL scalar type.
 * This maps to the `@specifiedBy` directive in the emitted GraphQL schema.
 *
 * @param url URL to the scalar type specification
 * @example
 * ```typespec
 * @specifiedBy("https://scalars.graphql.org/andimarek/date-time")
 * scalar DateTime extends utcDateTime;
 * ```
 */
export type SpecifiedByDecorator = (
  context: DecoratorContext,
  target: Scalar,
  url: string,
) => DecoratorValidatorCallbacks | void;

export type TypeSpecGraphQLDecorators = {
  graphqlInterface: GraphqlInterfaceDecorator;
  compose: ComposeDecorator;
  operationFields: OperationFieldsDecorator;
  mutation: MutationDecorator;
  query: QueryDecorator;
  subscription: SubscriptionDecorator;
  schema: SchemaDecorator;
  specifiedBy: SpecifiedByDecorator;
};

/** Check if the `@TypeSpec.GraphQL.inputType` decorator was applied on the given target. */
export function isInputType(program: Program, target: Model): boolean {
  return hasAutoDecorator(program, "TypeSpec.GraphQL.inputType", target);
}

/**
 * Mark a model as a GraphQL input type in the emitted schema.
 *
 * This decorator is applied automatically by the mutation engine when it produces
 * a model that is used in input position. The emitter uses this to emit the model
 * as an `input` type rather than an object `type`.
 */
export function setInputType(program: Program, target: Model): void {
  setAutoDecorator(program, "TypeSpec.GraphQL.inputType", target);
}

/** Check if the `@TypeSpec.GraphQL.nullable` decorator was applied on the given target. */
export function isNullable(
  program: Program,
  target: ModelProperty | Operation | Union | Model,
): boolean {
  return hasAutoDecorator(program, "TypeSpec.GraphQL.nullable", target);
}

/**
 * Mark a field, operation, or type as nullable in the emitted GraphQL schema.
 *
 * Applied automatically by the mutation engine when it strips `| null` from
 * union types, and can also be applied directly in TypeSpec source.
 */
export function setNullable(
  program: Program,
  target: ModelProperty | Operation | Union | Model,
): void {
  setAutoDecorator(program, "TypeSpec.GraphQL.nullable", target);
}

/** Check if the `@TypeSpec.GraphQL.nullableElements` decorator was applied on the given target. */
export function isNullableElements(program: Program, target: ModelProperty | Operation): boolean {
  return hasAutoDecorator(program, "TypeSpec.GraphQL.nullableElements", target);
}

/**
 * Mark a field or operation as having nullable array elements in the emitted GraphQL schema.
 *
 * Applied automatically by the mutation engine when it detects `Array<T | null>`
 * patterns. Causes the emitter to emit `[T]` instead of `[T!]`.
 */
export function setNullableElements(program: Program, target: ModelProperty | Operation): void {
  setAutoDecorator(program, "TypeSpec.GraphQL.nullableElements", target);
}

/** Check if the `@TypeSpec.GraphQL.oneOf` decorator was applied on the given target. */
export function isOneOf(program: Program, target: Model): boolean {
  return hasAutoDecorator(program, "TypeSpec.GraphQL.oneOf", target);
}

/**
 * Mark a model as a `@oneOf` input object in the emitted GraphQL schema.
 *
 * This decorator is applied automatically by the mutation engine when it converts
 * a union type in input context to a synthetic input object (since GraphQL unions
 * are output-only). The emitter uses this to emit the `@oneOf` directive.
 */
export function setOneOf(program: Program, target: Model): void {
  setAutoDecorator(program, "TypeSpec.GraphQL.oneOf", target);
}
