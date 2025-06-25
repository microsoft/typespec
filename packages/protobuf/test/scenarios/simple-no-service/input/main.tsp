import "@typespec/protobuf";

using Protobuf;

@package({
  name: "com.azure.Test",
})
namespace Test;

model Input {
  @field(1) testInputField: string;
}

model Output {
  @field(1) testOutputField: int32;
  @field(2) secondField: string;
}

@message
model ExplicitlyDeclared {
  @field(2) testField: string;
}
