import "@typespec/http";
import "@typespec/rest";
import "../shared/animal.tsp";

using TypeSpec.Http;

@service(#{ title: "Sample Animals" })
@doc("Base package that defines and generates the Animal base model.")
namespace SampleAnimals;

@route("/animals")
interface AnimalOperations {
  @doc("Round-trip an animal.")
  @put
  @route("/animal")
  updateAnimal(@body animal: Animal): Animal;
}
