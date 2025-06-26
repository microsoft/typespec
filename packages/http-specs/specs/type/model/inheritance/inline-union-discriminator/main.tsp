import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Illustrates inheritance with inline union discriminator.")
@scenarioService("/type/model/inheritance/inline-union-discriminator")
namespace Type.Model.Inheritance.InlineUnionDiscriminator;

@doc("Base model for polymorphic inheritance with inline union discriminator.")
@discriminator("kind")
model Pet {
  @doc("The kind of pet")
  kind: "cat" | "dog";
  
  @doc("Name of the pet")
  name: string;
}

@doc("Cat model")
model Cat extends Pet {
  @doc("discriminator property")
  kind: "cat";
  
  @doc("Whether the cat likes to meow")
  meow: boolean;
}

@doc("Dog model") 
model Dog extends Pet {
  @doc("discriminator property")
  kind: "dog";
  
  @doc("The bark sound of the dog")
  bark: string;
}

@scenario
@route("/model")
@scenarioDoc("""
  Generate and receive polymorphic model with inline union discriminator.
  Expected response body:
  ```json
  {"kind": "cat", "name": "Fluffy", "meow": true}
  ```
  """)
@get
op get(): Pet;

@scenario
@route("/model")
@scenarioDoc("""
  Generate and send polymorphic model with inline union discriminator.
  Expected input body:
  ```json
  {"kind": "cat", "name": "Fluffy", "meow": true}
  ```
  """)
@put
op put(@body input: Pet): NoContentResponse;

@scenario
@route("/missingdiscriminator")
@scenarioDoc("""
  Get a model omitting the discriminator.
  Expected response body:
  ```json
  {"name": "Fluffy", "meow": true}
  ```
  """)
@get
op getMissingDiscriminator(): Pet;

@scenario
@route("/wrongdiscriminator")
@scenarioDoc("""
  Get a model containing discriminator value never defined.
  Expected response body:
  ```json
  {"kind": "bird", "name": "Tweety"}
  ```
  """)
@get
op getWrongDiscriminator(): Pet;