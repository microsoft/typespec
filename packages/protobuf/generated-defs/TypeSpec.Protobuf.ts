import type {
  DecoratorContext,
  Interface,
  ModelProperty,
  Namespace,
  Operation,
  Type,
} from "@typespec/compiler";

/**
 * Declares that a model is a Protobuf message.
 *
 * Messages can be detected automatically if either of the following two conditions are met:
 *
 * - The model has a `@field` annotation on all of its properties.
 * - The model is referenced by any service operation.
 *
 * This decorator will force the emitter to check and emit a model.
 */
export type MessageDecorator = (context: DecoratorContext, target: Type) => void;

/**
 * Defines the field index of a model property for conversion to a Protobuf
 * message.
 *
 * The field index of a Protobuf message must:
 * - fall between 1 and 2<sup>29</sup> - 1, inclusive.
 * - not fall within the implementation reserved range of 19000 to 19999, inclusive.
 * - not fall within any range that was [marked reserved](#
 *
 * @TypeSpec .Protobuf.reserve).
 *
 * #### API Compatibility Note
 *
 * Fields are accessed by index, so changing the index of a field is an API breaking change.
 *
 * #### Encoding
 *
 * Field indices between 1 and 15 are encoded using a single byte, while field indices from 16 through 2047 require two
 * bytes, so those indices between 1 and 15 should be preferred and reserved for elements that are frequently or always
 * set in the message. See the [Protobuf binary format](https://protobuf.dev/programming-guides/encoding/).
 * @param index The whole-number index of the field.
 * @example
 * ```typespec
 * model ExampleMessage {
 *   @field(1)
 *   test: string;
 * }
 * ```
 */
export type FieldDecorator = (
  context: DecoratorContext,
  target: ModelProperty,
  index: number,
) => void;

/**
 * Reserve a field index, range, or name. If a field definition collides with a reservation, the emitter will produce
 * an error.
 *
 * This decorator accepts multiple reservations. Each reservation is one of the following:
 *
 * - a `string`, in which case the reservation refers to a field name.
 * - a `uint32`, in which case the reservation refers to a field index.
 * - a tuple `[uint32, uint32]`, in which case the reservation refers to a field range that is _inclusive_ of both ends.
 *
 * Unlike in Protobuf, where field name and index reservations must be separated, you can mix string and numeric field
 * reservations in a single `@reserve` call in TypeSpec.
 *
 * #### API Compatibility Note
 *
 * Field reservations prevent users of your Protobuf specification from using the given field names or indices. This can
 * be useful if a field is removed, as it will further prevent adding a new, incompatible field and will prevent users
 * from utilizing the field index at runtime in a way that may break compatibility with users of older specifications.
 *
 * See _[Protobuf Language Guide - Reserved Fields](https://protobuf.dev/programming-guides/proto3/#reserved)_ for more
 * information.
 *
 * @param reservations a list of field reservations
 * @example
 * ```typespec
 * // Reserve the fields 8-15 inclusive, 100, and the field name "test" within a model.
 * @reserve([8, 15], 100, "test")
 * model Example {
 *   // ...
 * }
 * ```
 */
export type ReserveDecorator = (
  context: DecoratorContext,
  target: Type,
  ...reservations: (string | unknown | number)[]
) => void;

/**
 * Declares that a TypeSpec interface constitutes a Protobuf service. The contents of the interface will be converted to
 * a `service` declaration in the resulting Protobuf file.
 */
export type ServiceDecorator = (context: DecoratorContext, target: Interface) => void;

/**
 * Declares that a TypeSpec namespace constitutes a Protobuf package. The contents of the namespace will be emitted to a
 * single Protobuf file.
 *
 * @param details the optional details of the package
 */
export type PackageDecorator = (
  context: DecoratorContext,
  target: Namespace,
  details?: Type,
) => void;

/**
 * Set the streaming mode of an operation. See [StreamMode](./data-types#TypeSpec.Protobuf.StreamMode) for more information.
 *
 * @param mode The streaming mode to apply to this operation.
 * @example
 * ```typespec
 * @stream(StreamMode.Out)
 * op logs(...LogsRequest): LogEvent;
 * ```
 * @example
 * ```typespec
 * @stream(StreamMode.Duplex)
 * op connectToMessageService(...Message): Message;
 * ```
 */
export type StreamDecorator = (context: DecoratorContext, target: Operation, mode: Type) => void;

export type TypeSpecProtobufDecorators = {
  message: MessageDecorator;
  field: FieldDecorator;
  reserve: ReserveDecorator;
  service: ServiceDecorator;
  package: PackageDecorator;
  stream: StreamDecorator;
};
