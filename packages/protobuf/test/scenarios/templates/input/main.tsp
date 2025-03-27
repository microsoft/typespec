import "@typespec/protobuf";

using Protobuf;

@package({
  name: "com.azure.Test",
})
namespace Test;

@Protobuf.service
interface Service {
  foo(...Templated<string>): Templated<uint32>;

  listOperation(...List<string>): List<uint32>;

  sameTemplate(...Templated<string>): void;
}

@friendlyName("{name}List", T)
model List<T> {
  @field(1) values: T[];
}

model Templated<T> {
  @field(1) value: T;
  @field(2) other: int32;
}
