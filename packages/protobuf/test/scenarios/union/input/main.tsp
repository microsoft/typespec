import "@typespec/protobuf";

using TypeSpec.Protobuf;

@package
namespace Test;

@Protobuf.service
interface Service {
  foo(...Input): Output;
}

model Input {
  @field(1) value: UnionA;
}

model InputA {
  @field(1) testInputField: string;
}

union UnionA {
  @field(1) a: InputA,
  @field(2) b: InputB,
  @field(3) c: string,
}

union UnionB {
  @field(1) int: int32,
  @field(2) str: string,
}

model InputB {
  @field(1) testInputField: uint32;
}

model Output {
  @field(1) testOutputField: int32;
  @field(2) secondField: string;
}
