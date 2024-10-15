import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Illustrates not-discriminated inheritance model.")
@scenarioService("/type/model/inheritance/not-discriminated")
namespace Type.Model.Inheritance.NotDiscriminated;

@doc("This is base model for not-discriminated normal multiple levels inheritance.")
model Pet {
  name: string;
}

@doc("The second level model in the normal multiple levels inheritance.")
model Cat extends Pet {
  age: int32;
}

@doc("The third level model in the normal multiple levels inheritance.")
model Siamese extends Cat {
  smart: boolean;
}

@scenario
@scenarioDoc("""
  Generate and send model.
  Expected input body:
  ```json
  {"name": "abc", "age": 32, "smart": true}
  ```
  """)
@route("/valid")
@post
op postValid(@body input: Siamese): NoContentResponse;

@scenario
@scenarioDoc("""
  Generate and receive model.
  Expected response body:
  ```json
  {"name": "abc", "age": 32, "smart": true}
  ```
  """)
@route("/valid")
@get
op getValid(): Siamese;

@scenario
@scenarioDoc("Generate, send, and receive round-trip bottom model.")
@route("/valid")
@put
op putValid(@body input: Siamese): Siamese;
