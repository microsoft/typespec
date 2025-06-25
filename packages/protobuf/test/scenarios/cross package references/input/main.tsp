import "@typespec/protobuf";

using Protobuf;

@package({
  name: "A",
})
namespace A {
  model Output {
    @field(1) testOutputField: int32;
    @field(2) secondField: string;
  }

  model ReferentInput {
    @field(1) referentField: C.Input;
  }
}

@package({
  name: "B",
})
namespace B {
  @Protobuf.service
  interface Service {
    foo(...Input): A.Output;
    bar(...A.ReferentInput): A.Output;
  }

  model Input {
    @field(1) testInputField: string;
    @field(2) mapField: Map<string, A.ReferentInput>;
    @field(3) repeatedField: A.ReferentInput[];
  }
}

@package({
  name: "C",
})
namespace C {
  model Input {
    @field(1) testInputField: string;
  }
}
