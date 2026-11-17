import "@typespec/protobuf";

using Protobuf;

@package
namespace Test;

model Input {
  @field(1) labels: Map<string, string>;
}

// A map's values are still checked against its value type.
const input: Input = #{ labels: #{ team: 1 } };

@Protobuf.service
interface Service {
  foo(...Input): Input;
}
