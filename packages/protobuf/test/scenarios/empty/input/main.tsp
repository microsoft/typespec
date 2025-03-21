import "@typespec/protobuf";

using Protobuf;

@package
namespace Test;

@Protobuf.service
interface Service {
  foo(): Output;
}

model Output {
  @field(1) testOutputField: int32;
}
