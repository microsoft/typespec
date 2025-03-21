import "@typespec/protobuf";

using Protobuf;

@package
namespace Test;

@Protobuf.service
interface Service {
  foo(...Input): Output;
}

model Input {
  @field(1) value: U;
}

model InputA {
  @field(1) testInputField: string;
}

union U {
  a: InputA,
  b: InputB,
}

model InputB {
  @field(1) testInputField: uint32;
}

model Output {
  @field(1) testOutputField: int32;
  @field(2) secondField: string;
}
