import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Illustrates inheritance with single discriminator.")
@scenarioService("/type/model/inheritance/single-discriminator")
namespace Type.Model.Inheritance.SingleDiscriminator;

@doc("This is base model for polymorphic single level inheritance with a discriminator.")
@discriminator("kind")
model Bird {
  kind: string;
  wingspan: int32;
}

@doc("The second level model in polymorphic single level inheritance.")
model SeaGull extends Bird {
  kind: "seagull";
}

@doc("The second level model in polymorphic single level inheritance.")
model Sparrow extends Bird {
  kind: "sparrow";
}

@doc("The second level model in polymorphic single level inheritance.")
model Goose extends Bird {
  kind: "goose";
}

@doc("The second level model in polymorphic single levels inheritance which contains references to other polymorphic instances.")
model Eagle extends Bird {
  kind: "eagle";
  friends?: Bird[];
  hate?: Record<Bird>;
  partner?: Bird;
}

@doc("Define a base class in the legacy way. Discriminator property is not explicitly defined in the model.")
@discriminator("kind")
model Dinosaur {
  size: int32;
}

@doc("The second level legacy model in polymorphic single level inheritance.")
model TRex extends Dinosaur {
  kind: "t-rex";
}

@scenario
@route("/model")
@scenarioDoc("""
  Generate and receive polymorphic model in single level inheritance with 1 discriminator.
  Expected response body:
  ```json
  {"wingspan": 1, "kind": "sparrow"}
  ```
  """)
@get
op getModel(): Bird;

@scenario
@route("/model")
@scenarioDoc("""
  Generate and send polymorphic model in single level inheritance with 1 discriminator.
  Expected input body:
  ```json
  {"wingspan": 1, "kind": "sparrow"}
  ```
  """)
@put
op putModel(@body input: Bird): NoContentResponse;

@scenario
@route("/recursivemodel")
@scenarioDoc("""
  Generate and receive polymorphic models has collection and dictionary properties referring to other polymorphic models.
  Expected response body:
  ```json
  {
    "wingspan": 5,
    "kind": "eagle",
    "partner": {
      "wingspan": 2,
      "kind": "goose"
    },
    "friends": [
      {
        "wingspan": 2,
        "kind": "seagull"
      }
    ],
    "hate": {
      "key3": {
        "wingspan": 1,
        "kind": "sparrow"
      }
    }
  }
  ```
  """)
@get
op getRecursiveModel(): Bird;

@scenario
@route("/recursivemodel")
@scenarioDoc("""
  Generate and send polymorphic models has collection and dictionary properties referring to other polymorphic models.
  Expected input body:
  ```json
  {
    "wingspan": 5,
    "kind": "eagle",
    "partner": {
      "wingspan": 2,
      "kind": "goose"
    },
    "friends": [
      {
        "wingspan": 2,
        "kind": "seagull"
      }
    ],
    "hate": {
      "key3": {
        "wingspan": 1,
        "kind": "sparrow"
      }
    }
  }
  ```
  """)
@put
op putRecursiveModel(@body input: Bird): NoContentResponse;

@scenario
@route("/missingdiscriminator")
@scenarioDoc("""
  Get a model omitting the discriminator.
  Expected response body:
  ```json
  {"wingspan": 1}
  ```
  """)
@get
op getMissingDiscriminator(): Bird;

@scenario
@route("/wrongdiscriminator")
@scenarioDoc("""
  Get a model containing discriminator value never defined.
  Expected response body:
  ```json
  {"wingspan": 1, "kind": "wrongKind" }
  ```
  """)
@get
op getWrongDiscriminator(): Bird;

@scenario
@route("/legacy-model")
@scenarioDoc("""
  Generate and receive polymorphic model defined in legacy way.
  Expected response body:
  ```json
  {"size": 20, "kind": "t-rex"}
  ```
  """)
@get
op getLegacyModel(): Dinosaur;
