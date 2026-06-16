import "@typespec/http";
import "@typespec/rest";
import "../shared/animal.tsp";

using TypeSpec.Http;

@service(#{ title: "Sample Pets" })
@doc("Extended package whose models extend the Animal base model from the SampleAnimals package.")
namespace SamplePets;

@doc("Pet is an animal that can be trained.")
model Pet extends SampleAnimals.Animal {
  kind: "pet";

  @doc("Whether the pet is trained.")
  trained: boolean;
}

@doc("Dog is a specific kind of animal.")
model Dog extends SampleAnimals.Animal {
  kind: "dog";

  @doc("Whether the dog is trained.")
  trained: boolean;

  @doc("The breed of the dog.")
  breed: string;
}

@route("/pets")
interface PetOperations {
  @doc("Round-trip a pet.")
  @put
  @route("/pet")
  updatePet(@body pet: Pet): Pet;

  @doc("Round-trip a dog.")
  @put
  @route("/dog")
  updateDog(@body dog: Dog): Dog;
}
