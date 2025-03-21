import "@typespec/protobuf";

using Protobuf;

@package
namespace Test;

@Protobuf.service
interface Service {
  foo(...Input): Output;
}

model Input {
  @field(1) testInputField: string;
  @field(2) type: InputType;
  @field(3) aliased: InputTypeWithAlias;
}

enum InputType {
  FOO: 0,
  BAR: 1,
}

enum InputTypeWithAlias {
  BAZ: 0,
  QUX: 1,
  FUZ: 1,
}

model Output {
  @field(1) testOutputField: int32;
  @field(2) secondField: string;
}
