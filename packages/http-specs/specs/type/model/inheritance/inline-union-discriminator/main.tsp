import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Illustrates inheritance with inline union discriminator.")
@scenarioService("/type/model/inheritance/inline-union-discriminator")
namespace Type.Model.Inheritance.InlineUnionDiscriminator;

@doc("This is base model for polymorphic inheritance with an inline union discriminator.")
@discriminator("type")
model ResponseFormat {
  @doc("The type of response format")
  type: "text" | "json_object" | "json_schema";
}

@doc("Text response format model")
model ResponseFormatText extends ResponseFormat {
  @doc("discriminator property")
  type: "text";
}

@doc("JSON object response format model")
model ResponseFormatJson extends ResponseFormat {
  @doc("discriminator property")
  type: "json_object";
}

@doc("JSON schema response format model")
model ResponseFormatJsonSchema extends ResponseFormat {
  @doc("discriminator property")
  type: "json_schema";
}

@doc("A simpler base model with only two discriminator values.")
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
  {"type": "text"}
  ```
  """)
@get
op getModel(): ResponseFormat;

@scenario
@route("/model")
@scenarioDoc("""
  Generate and send polymorphic model with inline union discriminator.
  Expected input body:
  ```json
  {"type": "text"}
  ```
  """)
@put
op putModel(@body input: ResponseFormat): NoContentResponse;

@scenario
@route("/simplemodel")
@scenarioDoc("""
  Generate and receive polymorphic model with simple inline union discriminator.
  Expected response body:
  ```json
  {"kind": "cat", "name": "Fluffy", "meow": true}
  ```
  """)
@get
op getSimpleModel(): Pet;

@scenario
@route("/simplemodel")
@scenarioDoc("""
  Generate and send polymorphic model with simple inline union discriminator.
  Expected input body:
  ```json
  {"kind": "cat", "name": "Fluffy", "meow": true}
  ```
  """)
@put
op putSimpleModel(@body input: Pet): NoContentResponse;

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