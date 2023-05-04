import "@typespec/protobuf";

using TypeSpec.Protobuf;

@package({
  name: "com.azure.Test",
})
namespace Test;

@Protobuf.service
interface Service {
  foo(...Input): void;
}

model Input {
  @field(1) testInputField: unknown;
}
