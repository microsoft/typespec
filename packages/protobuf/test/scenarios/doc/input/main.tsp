import "@typespec/protobuf";

using Protobuf;

@package({
  name: "com.azure.Test",
})
@doc("A test package.")
namespace Test;

/**
 * A test service.
 */
@Protobuf.service
interface Service {
  /**
   * A test method.
   */
  foo(...Input): Output;

  /**
   * Another test method.
   *
   * @param barInputField A test input field declared with 'param'.
   */
  bar(@field(1) barInputField: string): Output;
}

/**
 * A test input message.
 */
model Input {
  /**
   * A test input field.
   */
  @field(1) testInputField: string;
}

/**
 * A test output message.
 */
model Output {
  /**
   * A test output field.
   */
  @field(1) testOutputField: int32;

  /**
   * A second test output field.
   */
  @field(2) secondField: Qux;
}

/**
 * A test enum.
 */
enum Qux {
  /**
   * A test enum value.
   */
  QUUX: 0,

  /**
   * Another test enum value.
   */
  CORGE: 1,
}
