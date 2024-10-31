import "@typespec/protobuf";

using TypeSpec.Protobuf;

@package({
  name: "com.azure.Test",
})
namespace Test;

@Protobuf.service
interface Service {
  foo(...Input): Output;
}

model Input {
  @field(1) testInputField: string;
}

model Output {
  @optional
  @field(1)
  testOutputField: int32;

  @optional
  @field(2)
  secondField?: string;
}
