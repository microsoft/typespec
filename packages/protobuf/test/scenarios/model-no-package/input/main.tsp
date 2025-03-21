import "@typespec/protobuf";

using Protobuf;

model Input {
  @field(1) name: string;
}

@package
namespace Test {
  @Protobuf.service
  interface Service {
    // Reference a message type that isn't in this package.
    example(@field(1) input: Input): WellKnown.Empty;

    // Spread input directly
    example2(...Input): WellKnown.Any;
  }
}
