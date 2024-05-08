import "@typespec/protobuf";

using TypeSpec.Protobuf;

@package
namespace Test;

@Protobuf.service
interface Service {
  foo(...Input): {};
}

@reserve(2, 15, #[9, 11], "foo", string, uint32)
model Input {
  @field(1) testInputField: string;
}
