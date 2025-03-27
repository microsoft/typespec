import "@typespec/protobuf";

using Protobuf;

@package
namespace Test;

@Protobuf.service
interface Service {
  foo(...Input): {};
}

@reserve(2, 15, #[9, 11], "foo", "bar")
model Input {
  @field(1) testInputField: string;
}
