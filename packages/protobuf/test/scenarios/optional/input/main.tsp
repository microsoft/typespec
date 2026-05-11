import "@typespec/protobuf";

using Protobuf;

@package
namespace Test;

@Protobuf.service
interface Service {
  foo(...Input): Output;
}

enum Status {
  Unknown: 0,
  Ready: 1,
}

model Input {
  @field(1) id: string;
}

model Details {
  @field(1) note: string;
}

model Output {
  @field(1) count?: int32;
  @field(2) name?: string;
  @field(3) status?: Status;
  @field(4) details?: Details;
}
