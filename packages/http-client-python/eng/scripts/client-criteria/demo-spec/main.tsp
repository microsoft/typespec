import "@typespec/http";
import "@typespec/rest";
import "@azure-tools/typespec-client-generator-core";
import "@typespec/spector";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;
using TypeSpec.Spector;

@scenarioService("/surface-demo")
@scenario("SurfaceDemo")
@scenarioDoc("Surface-only checks: a client-renamed enum and a reshaped client hierarchy.")
@service
namespace SurfaceDemo;

// --- Example 1: client naming -------------------------------------------
@clientName("ClientExtensibleEnum")
@surfaceDoc("Enum is surfaced to clients as `ClientExtensibleEnum`.")
enum ServerExtensibleEnum {
  One: "one",
  Two: "two",
}

// --- Example 2: hierarchy building --------------------------------------

@discriminator("kind")
model Animal {
  @doc("The kind of animal")
  kind: string;

  @doc("Name of the animal")
  name: string;
}

alias PetContent = {
  @doc("Whether the pet is trained")
  trained: boolean;
};

model Pet extends Animal {
  kind: "pet";
  ...PetContent;
}

alias DogContent = {
  @doc("The breed of the dog")
  breed: string;
};

@surfaceDoc("Dog is surfaced as a subtype of Pet, not a direct subtype of Animal.")
@global.Azure.ClientGenerator.Core.Legacy.hierarchyBuilding(Pet)
model Dog extends Animal {
  kind: "dog";
  ...PetContent;
  ...DogContent;
}

@route("/kind")
op getKind(): { @body kind: ServerExtensibleEnum };

@route("/dog")
op getDog(): { @body dog: Dog };
