import "@typespec/versioning";

using TypeSpec.Versioning;

@versioned(Versions)
namespace Library;

enum Versions {
  v1_0: "1.0",
  v1_1: "1.1",
}

model PetToy {
  name: string;

  @added(Versions.v1_1)
  material: string;
}
