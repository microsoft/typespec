import "@typespec/protobuf";

using Protobuf;

@package
namespace Test;

@Protobuf.service
interface Service {
  // invalid field index
  invalidIndices(
    @field(0) testInputField: string,
    @field(536870912) testInputField2: string,
    @field(19000) testInputField3: string,
    @field(19123) testInputField4: string,
    @field(19999) testInputField5: string,
  ): {};
}

// Cannot apply @message to interface
@message
interface Test {}
