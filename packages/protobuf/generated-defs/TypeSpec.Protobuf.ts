import type {
  DecoratorContext,
  DecoratorValidatorCallbacks,
  Interface,
  ModelProperty,
  Namespace,
  Operation,
  Type,
  UnionVariant,
} from "@typespec/compiler";

/**
 * Declares that a model is a Protobuf message.
 *
 * Messages can be detected automatically if either of the following two conditions are met:
 *
 * - The model has a `@field` annotation on all of its properties.
 * - The model is referenced by any service operation.
 *
 * This decorator will force the emitter to check and emit a model. A named union annotated with this decorator is
 * emitted as a wrapper message containing a `oneof value`.
 */
export type MessageDecorator = (
  context: DecoratorContext,
  target: Type,
) => DecoratorValidatorCallbacks | void;

/**
 * Defines the field index of a model property or union variant for conversion to a Protobuf
 * message.
 *
 * When applied to the variants of a named union, the union can be used as the type of a message field:
 *
 * - If the model property has no `@field` decorator, the union is emitted inline as a `oneof` named after the
 * property, and the variant field indices share the field index space of the containing message. The property
 * must be optional.
 * - If the model property has a `@field` decorator, the union is emitted as a wrapper message (named after the
 * union) that contains a `oneof value`, and the variant field indices belong to the wrapper message.
 *
 * Union variants used in a `oneof` cannot be arrays or maps.
 *
 * The field index of a Protobuf message must:
 * - fall between 1 and 2<sup>29</sup> - 1, inclusive.
 * - not fall within the implementation reserved range of 19000 to 19999, inclusive.
 * - not fall within any range that was [marked reserved](#%40TypeSpec.Protobuf.reserve).
 * - not be used by any other field of the same message, including members of a `oneof`.
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
 *
 * @param index The whole-number index of the field.
 * @example
 * ```typespec
 * model ExampleMessage {
 *   @field(1)
 *   test: string;
 * }
 * ```
 * @example
 * ```typespec
 * union Payment {
 *   @field(10) card: CardPayment,
 *   @field(11) bank_transfer: BankTransfer,
 * }
 *
 * model Order {
 *   @field(1) id: string;
 *
 *   // Emitted inline as `oneof payment { CardPayment card = 10; BankTransfer bank_transfer = 11; }`
 *   payment?: Payment;
 * }
 * ```
 */
export type FieldDecorator = (
  context: DecoratorContext,
  target: ModelProperty | UnionVariant,
  index: number,
) => DecoratorValidatorCallbacks | void;

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
) => DecoratorValidatorCallbacks | void;

/**
 * Declares that a TypeSpec interface constitutes a Protobuf service. The contents of the interface will be converted to
 * a `service` declaration in the resulting Protobuf file.
 */
export type ServiceDecorator = (
  context: DecoratorContext,
  target: Interface,
) => DecoratorValidatorCallbacks | void;

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
) => DecoratorValidatorCallbacks | void;

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
export type StreamDecorator = (
  context: DecoratorContext,
  target: Operation,
  mode: Type,
) => DecoratorValidatorCallbacks | void;

export type TypeSpecProtobufDecorators = {
  message: MessageDecorator;
  field: FieldDecorator;
  reserve: ReserveDecorator;
  service: ServiceDecorator;
  package: PackageDecorator;
  stream: StreamDecorator;
};
