import "@typespec/protobuf";

using Protobuf;

@package({
  name: "com.azure.Test",
})
namespace Test;

scalar MyInt32 extends int32;

@Protobuf.service
interface Service {
  foo(...Input): Output;
}

model Input {
  @field(1) testInputField: string;
}

model Output {
  @field(1) testOutputField: MyInt32;
  @field(2) secondField: string;
}
