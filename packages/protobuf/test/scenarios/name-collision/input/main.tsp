import "@typespec/protobuf";

using Protobuf;

@package
namespace Test;

model ExampleRequest {
  @field(1) test: uint32;
}

model ExampleResponse {
  @field(1) test: string;
}

@Protobuf.service
interface Service {
  // invalid field index
  example(@field(1) test: string): {
    @field(1) test: uint32;
  };

  example2(...ExampleRequest): ExampleResponse;
}
