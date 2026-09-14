import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

/**
 * Describe unions constrained to a common base type.
 */
@scenarioService("/type/union/extends")
namespace Type.Union.Extends;

model StructuralPetBase {
  name: string;
}

model StructuralCat {
  name: string;
  toy: string;
}

model StructuralDog {
  name: string;
  food: string;
}

union StructuralPet extends StructuralPetBase {
  cat: StructuralCat,
  dog: StructuralDog,
}

model ExplicitPetBase {
  name: string;
}

model ExplicitCat extends ExplicitPetBase {
  toy: string;
}

model ExplicitDog extends ExplicitPetBase {
  food: string;
}

union ExplicitPet extends ExplicitPetBase {
  cat: ExplicitCat,
  dog: ExplicitDog,
}

model MultipleNameBase {
  name: string;
}

model MultipleFoodBase {
  food: string;
}

model MultipleCat {
  name: string;
  food: string;
  toy: string;
}

model MultipleDog {
  name: string;
  food: string;
  bark: boolean;
}

union MultiplePetWithName extends MultipleNameBase {
  cat: MultipleCat,
  dog: MultipleDog,
}

union MultiplePetWithFood extends MultipleFoodBase {
  cat: MultipleCat,
  dog: MultipleDog,
}

model MultipleCases {
  byName: MultiplePetWithName[];
  byFood: MultiplePetWithFood[];
}

@route("/structural")
interface Structural {
  @scenario
  @scenarioDoc("""
    Send and receive a union whose variants structurally satisfy its base type.

    Expected request and response body:
    ```json
    [
      {
        "name": "mittens",
        "toy": "ball"
      },
      {
        "name": "rex",
        "food": "bones"
      }
    ]
    ```
    """)
  @put
  roundTrip(@body input: StructuralPet[]): StructuralPet[];
}

@route("/explicit")
interface Explicit {
  @scenario
  @scenarioDoc("""
    Send and receive a union whose variants explicitly extend its base type.

    Expected request and response body:
    ```json
    [
      {
        "name": "mittens",
        "toy": "ball"
      },
      {
        "name": "rex",
        "food": "bones"
      }
    ]
    ```
    """)
  @put
  roundTrip(@body input: ExplicitPet[]): ExplicitPet[];
}

@route("/multiple")
interface Multiple {
  @scenario
  @scenarioDoc("""
    Send and receive the same variants through unions constrained to different base types.

    Expected request and response body:
    ```json
    {
      "byName": [
        {
          "name": "mittens",
          "food": "fish",
          "toy": "ball"
        },
        {
          "name": "rex",
          "food": "bones",
          "bark": true
        }
      ],
      "byFood": [
        {
          "name": "mittens",
          "food": "fish",
          "toy": "ball"
        },
        {
          "name": "rex",
          "food": "bones",
          "bark": true
        }
      ]
    }
    ```
    """)
  @put
  roundTrip(@body input: MultipleCases): MultipleCases;
}
