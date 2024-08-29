import "@typespec/http";
import "@azure-tools/cadl-ranch-expect";

using TypeSpec.Http;

@doc("Illustrates multiple level inheritance with multiple enum discriminators.")
@scenarioService("/type/model/inheritance/enum-nested-discriminator")
namespace Type.Model.Inheritance.EnumNestedDiscriminator;

@doc("extensible enum type for discriminator")
union FishKind {
  string,

  @doc("The kind of fish is shark.")
  Shark: "shark",

  @doc("The kind of fish is salmon.")
  Salmon: "salmon",
}

@doc("This is base model for polymorphic multiple levels inheritance with a discriminator.")
@discriminator("kind")
model Fish {
  @doc("discriminator property")
  kind: FishKind;

  age: int32;
}

@doc("extensible enum type for discriminator")
union SharkKind {
  string,

  @doc("The kind of shark is saw.")
  Saw: "saw",

  @doc("The kind of shark is goblin.")
  Goblin: "goblin",
}

@doc("The second level model in polymorphic multiple levels inheritance and it defines a new discriminator.")
@discriminator("sharktype")
model Shark extends Fish {
  kind: FishKind.Shark;
  sharktype: SharkKind;
}

@doc("The second level model in polymorphic multiple levels inheritance which contains references to other polymorphic instances.")
model Salmon extends Fish {
  kind: FishKind.Salmon;
  friends?: Fish[];
  hate?: Record<Fish>;
  partner?: Fish;
}

@doc("The third level model SawShark in polymorphic multiple levels inheritance.")
model SawShark extends Shark {
  sharktype: SharkKind.Saw;
}

@doc("The third level model GoblinShark in polymorphic multiple levels inheritance.")
model GoblinShark extends Shark {
  sharktype: SharkKind.Goblin;
}

@scenario
@route("/model")
@scenarioDoc("""
  Generate and receive polymorphic model in multiple levels inheritance with 2 discriminators.
  Expected response body:
  ```json
  {"age": 1, "kind": "shark",  "sharktype": "goblin"}
  ```
  """)
@get
op getModel(): Fish;

@scenario
@route("/model")
@scenarioDoc("""
  Generate and send polymorphic model in multiple levels inheritance with 2 discriminators.
  Expected input body:
  ```json
  {"age": 1, "kind": "shark",  "sharktype": "goblin"}
  ```
  """)
@put
op putModel(@body input: Fish): NoContentResponse;

@scenario
@route("/recursivemodel")
@scenarioDoc("""
  Generate and receive polymorphic models has collection and dictionary properties referring to other polymorphic models.
  Expected response body:
  ```json
  {
    "age": 1,
    "kind": "salmon",
    "partner": {
      "age": 2,
      "kind": "shark",
      "sharktype": "saw"
    },
    "friends": [
      {
        "age": 2,
        "kind": "salmon",
        "partner": {
          "age": 3,
          "kind": "salmon"
        },
        "hate": {
          "key1": {
            "age": 4,
            "kind": "salmon"
          },
          "key2": {
            "age": 2,
            "kind": "shark",
            "sharktype": "goblin"
          }
        }
      },
      {
        "age": 3,
        "kind": "shark",
        "sharktype": "goblin"
      }
    ],
    "hate": {
      "key3": {
        "age": 3,
        "kind": "shark",
        "sharktype": "saw"
      },
      "key4": {
        "age": 2,
        "kind": "salmon",
        "friends": [
          {
            "age": 1,
            "kind": "salmon"
          },
          {
            "age": 4,
            "kind": "shark",
            "sharktype": "goblin"
          }
        ]
      }
    }
  }
  ```
  """)
@get
op getRecursiveModel(): Fish;

@scenario
@route("/recursivemodel")
@scenarioDoc("""
  Generate and send polymorphic models has collection and dictionary properties referring to other polymorphic models.
  Expected input body:
  ```json
  {
    "age": 1,
    "kind": "salmon",
    "partner": {
      "age": 2,
      "kind": "shark",
      "sharktype": "saw"
    },
    "friends": [
      {
        "age": 2,
        "kind": "salmon",
        "partner": {
          "age": 3,
          "kind": "salmon"
        },
        "hate": {
          "key1": {
            "age": 4,
            "kind": "salmon"
          },
          "key2": {
            "age": 2,
            "kind": "shark",
            "sharktype": "goblin"
          }
        }
      },
      {
        "age": 3,
        "kind": "shark",
        "sharktype": "goblin"
      }
    ],
    "hate": {
      "key3": {
        "age": 3,
        "kind": "shark",
        "sharktype": "saw"
      },
      "key4": {
        "age": 2,
        "kind": "salmon",
        "friends": [
          {
            "age": 1,
            "kind": "salmon"
          },
          {
            "age": 4,
            "kind": "shark",
            "sharktype": "goblin"
          }
        ]
      }
    }
  }
  ```
  """)
@put
op putRecursiveModel(@body input: Fish): NoContentResponse;

@scenario
@route("/missingdiscriminator")
@scenarioDoc("""
  Get a model omitting the discriminator.
  Expected response body:
  ```json
  {"age": 1}
  ```
  """)
@get
op getMissingDiscriminator(): Fish;

@scenario
@route("/wrongdiscriminator")
@scenarioDoc("""
  Get a model containing discriminator value never defined.
  Expected response body:
  ```json
  {"age": 1, "kind": "wrongKind" }
  ```
  """)
@get
op getWrongDiscriminator(): Fish;
