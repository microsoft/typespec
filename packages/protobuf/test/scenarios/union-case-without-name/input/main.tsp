import "@typespec/protobuf";

using TypeSpec.Protobuf;

@package
namespace Test;

union AllNamed {
  @field(1) a: string;
  @field(2) b: AllNamed;
}

union PartiallyNamed {
  @field(1) a: string;
  @field(2) int32;
}

union NotNamed {
  @field(1) string;
  @field(2) int32;
}
