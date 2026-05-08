import "@typespec/protobuf";

using Protobuf;

@package
namespace Test;

@Protobuf.service
interface Service {
  foo(...Input): Output;
}

model Input {
  @field(1) id: string;
}

model Output {
  @field(1) tags?: string[];
  @field(2) counters?: Map<sfixed32, string>;
}
