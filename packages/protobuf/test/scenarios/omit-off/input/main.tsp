import "@typespec/protobuf";

using Protobuf;

@package
namespace Test;

@message
model Input {
  @field(1) testInputField: string;
}

model Output {
  @field(1) testOutputField: int32;
  @field(2) secondField: string;
}
