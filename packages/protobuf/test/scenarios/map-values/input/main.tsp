import "@typespec/protobuf";

using Protobuf;

@package
namespace Test;

model Project {
  @field(1) name: string;
}

model Input {
  @field(1) labels: Map<string, string>;
  @field(2) projects: Map<string, Project>;
  @field(3) counts: Map<int32, uint64>;
}

// Object values fill a map: its keys are strings, as in ProtoJSON, and its values are checked.
const input: Input = #{
  labels: #{ team: "storage", `app.kubernetes.io/name`: "web" },
  projects: #{ main: #{ name: "TypeSpec" } },
  counts: #{ `1`: 2 },
};

@Protobuf.service
interface Service {
  @opExample(#{ parameters: input, returnType: input })
  foo(...Input): Input;
}
