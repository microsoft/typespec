import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

/**
 * Describe unions constrained to a common base type.
 */
@scenarioService("/type/union/extends")
namespace Type.Union.Extends;

namespace StructuralTypes {
  model PetBase {
    name: string;
  }

  model Cat {
    name: string;
    toy: string;
  }

  model Dog {
    name: string;
    food: string;
  }

  union Pet extends PetBase {
    cat: Cat,
    dog: Dog,
  }
}

namespace ExplicitTypes {
  model PetBase {
    name: string;
  }

  model Cat extends PetBase {
    toy: string;
  }

  model Dog extends PetBase {
    food: string;
  }

  union Pet extends PetBase {
    cat: Cat,
    dog: Dog,
  }
}

namespace MultipleTypes {
  model NameBase {
    name: string;
  }

  model FoodBase {
    food: string;
  }

  model Cat {
    name: string;
    food: string;
    toy: string;
  }

  model Dog {
    name: string;
    food: string;
    bark: boolean;
  }

  union PetWithName extends NameBase {
    cat: Cat,
    dog: Dog,
  }

  union PetWithFood extends FoodBase {
    cat: Cat,
    dog: Dog,
  }
}

model MultipleCases {
  byName: MultipleTypes.PetWithName[];
  byFood: MultipleTypes.PetWithFood[];
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
  roundTrip(@body input: StructuralTypes.Pet[]): StructuralTypes.Pet[];
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
  roundTrip(@body input: ExplicitTypes.Pet[]): ExplicitTypes.Pet[];
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
