import "@typespec/protobuf";

using TypeSpec.Protobuf;

@package({
  name: "com.azure.Test",
})
namespace Test;

@Protobuf.service
interface Service {
  foo(...Templated<string>): Templated<{}>;
}

model Templated<T> {
  @field(1) value: T;
  @field(2) other: int32;
}
