import "@typespec/protobuf";

using TypeSpec.Protobuf;

@package
namespace Test;

@Protobuf.service
interface Service {
  foo(...Input): WellKnown.Empty;
}

model Input {
  @field(1) testInputField: Map<sfixed32, string>;
}
