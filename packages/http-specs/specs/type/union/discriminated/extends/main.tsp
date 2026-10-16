import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Discriminated unions with explicit model constraints and nominally inherited variants.")
@scenarioService("/type/union/discriminated/extends")
namespace Type.Union.Discriminated.Extends;

@route("/explicit-discriminator")
namespace ExplicitDiscriminator {
  model PetBase {
    kind: string;
    name: string;
  }

  model Mammal extends PetBase {}

  model Cat extends Mammal {
    kind: "cat";
    meow: boolean;
  }

  model Dog extends PetBase {
    kind: "dog";
    bark: boolean;
  }

  @discriminated(#{ envelope: "none" })
  union Pet extends PetBase {
    cat: Cat,
    dog: Dog,
  }

  interface Operations
    extends PetOperations<
        Pet,
        """
          {"kind": "cat", "name": "Whiskers", "meow": true}
          """,
        """
          {"kind": "dog", "name": "Rex", "bark": false}
          """
      > {}
}

@route("/injected-discriminator")
namespace InjectedDiscriminator {
  model PetBase {
    name: string;
  }

  model Cat extends PetBase {
    meow: boolean;
  }

  model Dog extends PetBase {
    bark: boolean;
  }

  @discriminated(#{ envelope: "none" })
  union Pet extends PetBase {
    cat: Cat,
    dog: Dog,
  }

  interface Operations
    extends PetOperations<
        Pet,
        """
          {"kind": "cat", "name": "Whiskers", "meow": true}
          """,
        """
          {"kind": "dog", "name": "Rex", "bark": false}
          """
      > {}
}

@route("/custom-discriminator")
namespace CustomDiscriminator {
  model PetBase {
    name: string;
  }

  model Cat extends PetBase {
    meow: boolean;
  }

  model Dog extends PetBase {
    bark: boolean;
  }

  @discriminated(#{ envelope: "none", discriminatorPropertyName: "petType" })
  union Pet extends PetBase {
    feline: Cat,
    canine: Dog,
  }

  interface Operations
    extends PetOperations<
        Pet,
        """
          {"petType": "feline", "name": "Whiskers", "meow": true}
          """,
        """
          {"petType": "canine", "name": "Rex", "bark": false}
          """
      > {}
}

@route("/enum-discriminator")
namespace EnumDiscriminator {
  union PetKind {
    cat: "cat",
    dog: "dog",
  }

  model PetBase {
    kind: PetKind;
    name: string;
  }

  model Cat extends PetBase {
    kind: "cat";
    meow: boolean;
  }

  model Dog extends PetBase {
    kind: "dog";
    bark: boolean;
  }

  @discriminated(#{ envelope: "none" })
  union Pet extends PetBase {
    cat: Cat,
    dog: Dog,
  }

  interface Operations
    extends PetOperations<
        Pet,
        """
          {"kind": "cat", "name": "Whiskers", "meow": true}
          """,
        """
          {"kind": "dog", "name": "Rex", "bark": false}
          """
      > {}
}

@route("/recursive")
namespace Recursive {
  model PetBase {
    name: string;
    friend?: Pet;
    friends?: Pet[];
    lookup?: Record<Pet>;
    nullableFriend?: Pet | null;
  }

  model Cat extends PetBase {
    meow: boolean;
  }

  model Dog extends PetBase {
    bark: boolean;
  }

  @discriminated(#{ envelope: "none" })
  union Pet extends PetBase {
    cat: Cat,
    dog: Dog,
  }

  @scenario
  @scenarioDoc("""
    Receive an inline-discriminated union with recursive model, array, dictionary, and nullable properties.
    Expected response body:
    ```json
    {
      "kind": "cat",
      "name": "Whiskers",
      "meow": true,
      "friend": {"kind": "dog", "name": "Rex", "bark": false},
      "friends": [{"kind": "cat", "name": "Kitten", "meow": false}],
      "lookup": {"best": {"kind": "dog", "name": "Rex", "bark": false}},
      "nullableFriend": null
    }
    ```
    """)
  @get
  op get(): Pet;

  @scenario
  @scenarioDoc("""
    Send an inline-discriminated union with recursive model, array, dictionary, and nullable properties.
    Expected request body:
    ```json
    {
      "kind": "cat",
      "name": "Whiskers",
      "meow": true,
      "friend": {"kind": "dog", "name": "Rex", "bark": false},
      "friends": [{"kind": "cat", "name": "Kitten", "meow": false}],
      "lookup": {"best": {"kind": "dog", "name": "Rex", "bark": false}},
      "nullableFriend": null
    }
    ```
    The response has status 204 and no body.
    """)
  @put
  op put(@body input: Pet): NoContentResponse;
}

interface PetOperations<T, CatPayload extends valueof string, DogPayload extends valueof string> {
  @scenario
  @scenarioDoc("""
    Receive the cat alternative of a discriminated union with an explicit model constraint.
    Expected response body:
    ```json
    ${CatPayload}
    ```
    """)
  @route("/cat")
  @get
  getCat(): T;

  @scenario
  @scenarioDoc("""
    Send the cat alternative of a discriminated union with an explicit model constraint.
    Expected request body:
    ```json
    ${CatPayload}
    ```
    The response has status 204 and no body.
    """)
  @route("/cat")
  @put
  putCat(@body input: T): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Receive the dog alternative of a discriminated union with an explicit model constraint.
    Expected response body:
    ```json
    ${DogPayload}
    ```
    """)
  @route("/dog")
  @get
  getDog(): T;

  @scenario
  @scenarioDoc("""
    Send the dog alternative of a discriminated union with an explicit model constraint.
    Expected request body:
    ```json
    ${DogPayload}
    ```
    The response has status 204 and no body.
    """)
  @route("/dog")
  @put
  putDog(@body input: T): NoContentResponse;
}
