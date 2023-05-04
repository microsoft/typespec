import "@typespec/versioning";

using TypeSpec.Versioning;

@versioned(Versions)
namespace Library;

enum Versions {
  `1.0`,
  `1.1`,
}

model PetToy {
  name: string;

  @added(Versions.`1.1`)
  material: string;
}
