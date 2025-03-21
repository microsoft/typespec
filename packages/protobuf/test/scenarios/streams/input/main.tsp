import "@typespec/protobuf";

using Protobuf;

@package
namespace Test;

@Protobuf.service
interface Service {
  @stream(StreamMode.Duplex)
  duplex(...Input): Output;

  @stream(StreamMode.In)
  in(...Input): Output;

  @stream(StreamMode.Out)
  out(...Input): Output;

  @stream(StreamMode.None)
  none(...Input): Output;
}

model Input {
  @field(1) testInputField: string;
}

model Output {
  @field(1) testOutputField: int32;
  @field(2) secondField: string;
}
