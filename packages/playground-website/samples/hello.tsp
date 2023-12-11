import "@typespec/http";

@service
namespace Hello.World;

model World {
  planet: string;
  age: int32;
}

op hello(): World;
