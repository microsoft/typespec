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
}

enum InputType {
  FOO: 1,
  BAR: 2,
}

model Output {
  @field(2) secondField: string;
}
