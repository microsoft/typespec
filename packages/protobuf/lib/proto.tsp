import "../dist/src/tsp-index.js";

namespace TypeSpec.Protobuf;

/**
 * A model that represents an external Protobuf reference. This type can be used to import and utilize Protobuf
 * declarations that are not declared in TypeSpec within TypeSpec sources. When the emitter encounters an `Extern`, it
 * will insert an `import` statement for the corresponding `Path` and refer to the type by `Name`.
 *
 * #### Usage
 *
 * If you have a file called `test.proto` that declares a package named `test` and a message named `Widget`, you can
 * use the `Extern` type to declare a model in TypeSpec that refers to your external definition of `test.Widget`. See
 * the example below.
 *
 * When the TypeSpec definition of `Widget` is encountered, the Protobuf emitter will represent it as a reference to
 * `test.Widget` and insert an import for it, rather than attempt to convert the model to an equivalent message.
 *
 * @template Path the relative path to a `.proto` file to import
 * @template Name the fully-qualified reference to the type this model represents within the `.proto` file
 *
 * @example
 *
 * ```typespec
 * model Widget is Extern<"path/to/test.proto", "test.Widget">;
 * ```
 */
@Private.externRef(Path, Name)
model Extern<Path extends string, Name extends string> {
  // This _extern property is needed so that getEffectiveModelType will have something to look up. Without it, if an
  // Extern model is spread into the parameter of an operation, the resulting model is empty and carries no information
  // that can relate it back to its original definition.
  _extern: never;
}

/**
 * Contains some common well-known Protobuf types defined by the google.protobuf library.
 */
namespace WellKnown {
  /**
   * An empty message.
   *
   * This model references `google.protobuf.Empty` from `google/protobuf/empty.proto`.
   */
  model Empty is Extern<"google/protobuf/empty.proto", "google.protobuf.Empty">;

  /**
   * A timestamp.
   *
   * This model references `google.protobuf.Timestamp` from `google/protobuf/timestamp.proto`.
   */
  model Timestamp is Extern<"google/protobuf/timestamp.proto", "google.protobuf.Timestamp">;

  /**
   * Any value.
   *
   * This model references `google.protobuf.Any` from `google/protobuf/any.proto`.
   */
  model Any is Extern<"google/protobuf/any.proto", "google.protobuf.Any">;

  /**
   * A latitude and longitude.
   *
   * This model references `google.type.LatLng` from `google/type/latlng.proto`.
   */
  model LatLng is Extern<"google/type/latlng.proto", "google.type.LatLng">;
}

/**
 * A signed 32-bit integer that will use the `sint32` encoding when used in a Protobuf message.
 *
 * #### Protobuf binary format
 *
 * Uses variable-length encoding. These more efficiently encode negative numbers than regular int32s.
 */
scalar sint32 extends int32;

/**
 * A signed 64-bit integer that will use the `sint64` encoding when used in a Protobuf message.
 *
 * #### Protobuf binary format
 *
 * Uses variable-length encoding. These more efficiently encode negative numbers than regular `int64s`.
 */
scalar sint64 extends int64;

/**
 * A signed 32-bit integer that will use the `sfixed32` encoding when used in a Protobuf message.
 *
 * #### Protobuf binary format
 *
 * Always four bytes.
 */
scalar sfixed32 extends int32;

/**
 * A signed 64-bit integer that will use the `sfixed64` encoding when used in a Protobuf message.
 *
 * #### Protobuf binary format
 *
 * Always eight bytes.
 */
scalar sfixed64 extends int64;

/**
 * An unsigned 32-bit integer that will use the `fixed32` encoding when used in a Protobuf message.
 *
 * #### Protobuf binary format
 *
 * Always four bytes. More efficient than `uint32` if values are often greater than 2<sup>28</sup>.
 */
scalar fixed32 extends uint32;

/**
 * An unsigned 64-bit integer that will use the `fixed64` encoding when used in a Protobuf message.
 *
 * #### Protobuf binary format
 *
 * Always eight bytes. More efficient than `uint64` if values are often greater than 2<sup>56</sup>.
 */
scalar fixed64 extends uint64;

/**
 * Types recognized as "integral" types
 */
alias integral = int32 | int64 | uint32 | uint64 | boolean;

/**
 * A type representing a Protobuf `map`. Instances of this type in models will be converted to the built-in `map` type
 * in Protobuf.
 *
 * The key type of a Protobuf `map` must be any integral type or `string`. The value type can be any type other than
 * another `Map`.
 *
 * @template Key the key type (any integral type or string)
 * @template Value the value type (any type other than another map)
 */
@Private._map
model Map<Key extends integral | string, Value> {}

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
extern dec message(target: {});

/**
 * Defines the field index of a model property for conversion to a Protobuf
 * message.
 *
 * The field index of a Protobuf message must:
 *   - fall between 1 and 2<sup>29</sup> - 1, inclusive.
 *   - not fall within the implementation reserved range of 19000 to 19999, inclusive.
 *   - not fall within any range that was [marked reserved](#@TypeSpec.Protobuf.reserve).
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
 *
 * @example
 *
 * ```typespec
 * model ExampleMessage {
 *   @field(1)
 *   test: string;
 * }
 * ```
 */
extern dec field(target: TypeSpec.Reflection.ModelProperty, index: valueof uint32);

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
 *
 * @example
 *
 * ```typespec
 * // Reserve the fields 8-15 inclusive, 100, and the field name "test" within a model.
 * @reserve([8, 15], 100, "test")
 * model Example {
 *   // ...
 * }
 * ```
 */
extern dec reserve(target: {}, ...reservations: valueof (string | [uint32, uint32] | uint32)[]);

/**
 * Declares that a TypeSpec interface constitutes a Protobuf service. The contents of the interface will be converted to
 * a `service` declaration in the resulting Protobuf file.
 */
extern dec service(target: TypeSpec.Reflection.Interface);

// FIXME: cannot link to the package decorator directly because it is detected as a broken link.
/**
 * Details applied to a package definition by the [`@package`](./decorators#@TypeSpec.Protobuf.package) decorator.
 */
model PackageDetails {
  /**
   * The package's name.
   *
   * By default, the package's name is constructed from the namespace it is applied to.
   */
  name?: string;

  /**
   * The package's top-level options.
   *
   * See the [Protobuf Language Guide - Options](https://protobuf.dev/programming-guides/proto3/#options) for more information.
   *
   * Currently, only string, boolean, and numeric options are supported.
   */
  options?: Record<string | boolean | numeric>;
}

/**
 * Declares that a TypeSpec namespace constitutes a Protobuf package. The contents of the namespace will be emitted to a
 * single Protobuf file.
 *
 * @param details the optional details of the package
 */
extern dec package(target: TypeSpec.Reflection.Namespace, details?: PackageDetails);

/**
 * The streaming mode of an operation. One of:
 *
 * - `Duplex`: both the input and output of the operation are streaming.
 * - `In`: the input of the operation is streaming.
 * - `Out`: the output of the operation is streaming.
 * - `None`: neither the input nor the output are streaming.
 *
 * See the [`@stream`](./decorators#@TypeSpec.Protobuf.stream) decorator.
 */
enum StreamMode {
  /**
   * Both the input and output of the operation are streaming. Both the client and service will stream messages to each
   * other until the connections are closed.
   */
  Duplex,

  /**
   * The input of the operation is streaming. The client will send a stream of events; and, once the stream is closed,
   * the service will respond with a message.
   */
  In,

  /**
   * The output of the operation is streaming. The client will send a message to the service, and the service will send
   * a stream of events back to the client.
   */
  Out,

  /**
   * Neither the input nor the output are streaming. This is the default mode of an operation without the `@stream`
   * decorator.
   */
  None,
}

/**
 * Set the streaming mode of an operation. See [StreamMode](./data-types#TypeSpec.Protobuf.StreamMode) for more information.
 *
 * @param mode The streaming mode to apply to this operation.
 *
 * @example
 *
 * ```typespec
 * @stream(StreamMode.Out)
 * op logs(...LogsRequest): LogEvent;
 * ```
 *
 * @example
 *
 * ```typespec
 * @stream(StreamMode.Duplex)
 * op connectToMessageService(...Message): Message;
 * ```
 */
extern dec stream(target: TypeSpec.Reflection.Operation, mode: StreamMode);

namespace Private {
  extern dec externRef(target: Reflection.Model, path: string, name: string);
  extern dec _map(target: Reflection.Model);
}
