import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

/**
 * Describe unions constrained to a common base type.
 */
@scenarioService("/type/union/extends")
namespace Type.Union.Extends;

namespace Structural {
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

namespace Explicit {
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

namespace Multiple {
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

model UnionExtendsCases {
  structural: Structural.Pet[];
  explicit: Explicit.Pet[];
  multipleByName: Multiple.PetWithName[];
  multipleByFood: Multiple.PetWithFood[];
}

@scenario
@scenarioDoc("""
  Send and receive unions constrained to common base types.

  Expected request and response body:
  ```json
  {
    "structural": [
      {
        "name": "mittens",
        "toy": "ball"
      },
      {
        "name": "rex",
        "food": "bones"
      }
    ],
    "explicit": [
      {
        "name": "mittens",
        "toy": "ball"
      },
      {
        "name": "rex",
        "food": "bones"
      }
    ],
    "multipleByName": [
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
    "multipleByFood": [
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
@route("/")
@put
op roundTrip(@body input: UnionExtendsCases): UnionExtendsCases;
