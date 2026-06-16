import "@typespec/http";

using TypeSpec.Http;

@doc("Base package namespace that owns the Animal base model.")
namespace SampleAnimals;

@doc("Base animal with a discriminator. Generated into the base package (SampleAnimals) and referenced as an external type by the extended package (SamplePets).")
@discriminator("kind")
model Animal {
  @doc("The kind of animal.")
  kind: string;

  @doc("The name of the animal.")
  name: string;
}
