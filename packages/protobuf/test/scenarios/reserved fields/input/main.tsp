import "@typespec/protobuf";

using TypeSpec.Protobuf;

@package
namespace Test;

@Protobuf.service
interface Service {
  foo(...ModelInput): {};
}

@reserve(2, 15, #[9, 11], "foo", "bar")
model ModelInput {
  @field(1) testInputField: string;
}

@reserve(4, 16, #[10, 12], "baz", "bosh")
union UnionInput {
  @field(1) case1: string;
  @field(2) case2: int64;
}
