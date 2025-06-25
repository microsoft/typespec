import "@typespec/protobuf";

using Protobuf;

@package({
  name: "com.azure.test",
})
namespace Test;

@Protobuf.service
interface Service {
  foo(@field(1) testInputField: string): {
    @field(1) testOutputField: int32;
    @field(2) secondField: string;
  };
}
