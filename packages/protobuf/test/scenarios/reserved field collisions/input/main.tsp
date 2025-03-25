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
  @field(1) foo: string;
  @field(2) field2: int32;
  @field(9) field9: uint32;
  @field(11) bar: sint32;
}
