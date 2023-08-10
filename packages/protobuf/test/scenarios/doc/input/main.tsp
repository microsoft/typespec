import "@typespec/protobuf";

using TypeSpec.Protobuf;

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
  @field(2) secondField: string;
}
