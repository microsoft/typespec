import "@typespec/protobuf";

using TypeSpec.Protobuf;

@package({
  name: "A",
})
namespace A {
  model Output {
    @field(1) testOutputField: int32;
    @field(2) secondField: string;
  }
}

@package({
  name: "B",
})
namespace B {
  @Protobuf.service
  interface Service {
    foo(...Input): A.Output;
  }

  model Input {
    @field(1) testInputField: string;
  }
}
