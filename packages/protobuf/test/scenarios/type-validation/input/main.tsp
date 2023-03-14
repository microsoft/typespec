import "@typespec/protobuf";

using TypeSpec.Protobuf;

@package
namespace Test;

@Protobuf.service
interface Service {
  invalidReturn(): int32;
}
