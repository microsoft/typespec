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

  // Reference a union that isn't in this package.
  model Holder {
    @field(1) choice: Choice;
  }
}

union Choice {
  @field(1) input: Input,
}

// Unions marked with `@message` are emitted eagerly, so they must be in a package even when unreferenced.
@message
union EagerChoice {
  @field(1) input: Input,
}
