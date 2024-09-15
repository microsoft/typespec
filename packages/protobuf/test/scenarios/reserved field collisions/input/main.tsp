import "@typespec/protobuf";

using TypeSpec.Protobuf;

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

@reserve(22, 35, #[29, 31], "beep", "bosh")
union UnionInput {
  @field(21) beep: string;
  @field(22) boop: int32;
  @field(29) blap: uint32;
  @field(31) bosh: sint32;
}
