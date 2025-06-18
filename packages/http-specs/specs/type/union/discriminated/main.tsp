import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

/**
 * Describe scenarios for discriminated unions.
 */
@scenarioService("/type/union/discriminated")
namespace Type.Union.Discriminated;

// Models for discriminated unions
model Cat {
  name: string;
  meow: boolean;
}

model Dog {
  name: string;
  bark: boolean;
}

/**
 * Test discriminated union with default envelope serialization.
 * The discriminated union should serialize with "kind" as discriminator
 * and "value" as envelope property.
 */
@discriminated
union PetWithEnvelope {
  cat: Cat;
  dog: Dog;
}

@route("/envelope")
namespace Envelope {
  @route("/object")
  namespace Object {
    @route("/default")
    interface Default {
      @scenario
      @scenarioDoc("""
        Test discriminated union with envelope serialization.
        When value of query parameter "kind" is "cat" or no query parameter input, the expected response is:
        ```json
        {
          "kind": "cat",
          "value": {
            "name": "Whiskers",
            "meow": true
          }
        }
        ```
        When it is "dog", expected response is:
        ```json
        {
          "kind": "dog",
          "value": {
            "name": "Rex",
            "bark": false
          }
        }
        ```
        """)
      @get
      getDefault(@query kind?: string): PetWithEnvelope;

      @scenario
      @scenarioDoc("""
        Test discriminated union with envelope serialization.
        Send the union as:
        ```json
        {
          "kind": "cat", 
          "value": {
            "name": "Whiskers",
            "meow": true
          }
        }
        ```
        """)
      @put
      putDefault(@body input: PetWithEnvelope): PetWithEnvelope;
    }

    @route("/custom-properties")
    interface CustomProperties {
      @scenario
      @scenarioDoc("""
        Test discriminated union with custom property names.
        When value of query parameter "petType" is "cat" or no query parameter input, the expected response is:
        ```json
        {
          "petType": "cat",
          "petData": {
            "name": "Whiskers", 
            "meow": true
          }
        }
        ```
        When it is "dog", expected response is:
        ```json
        {
          "petType": "dog",
          "petData": {
            "name": "Rex",
            "bark": false
          }
        }
        ```
        """)
      @get
      getCustomProperties(@query petType?: string): PetWithCustomNames;

      @scenario
      @scenarioDoc("""
        Test discriminated union with custom property names.
        Send the union as:
        ```json
        {
          "petType": "cat",
          "petData": {
            "name": "Whiskers",
            "meow": true
          }
        }
        ```
        """)
      @put
      putCustomProperties(@body input: PetWithCustomNames): PetWithCustomNames;
    }
  }
}

/**
 * Test discriminated union with custom property names.
 * The discriminated union should serialize with custom discriminator
 * and envelope property names.
 */
@discriminated(#{
  discriminatorPropertyName: "petType",
  envelopePropertyName: "petData",
})
union PetWithCustomNames {
  cat: Cat;
  dog: Dog;
}

/**
 * Test discriminated union with inline discriminator (no envelope).
 * The discriminated union should serialize with discriminator property
 * injected directly into the variant object.
 */
@discriminated(#{ envelope: "none" })
union PetInline {
  cat: Cat;
  dog: Dog;
}

@route("/no-envelope")
interface NoEnvelope {
  @scenario
  @scenarioDoc("""
    Test discriminated union with inline discriminator.
    When value of query parameter "kind" is "cat" or no query parameter input, the expected response is:
    ```json
    {
      "kind": "cat",
      "name": "Whiskers",
      "meow": true
    }
    ```
    When it is "dog", expected response is:
    ```json
    {
      "kind": "dog",
      "name": "Rex",
      "bark": false
    }
    ```
    """)
  @get
  getNoEnvelope(@query kind?: string): PetInline;

  @scenario
  @scenarioDoc("""
    Test discriminated union with inline discriminator.
    Send the union as:
    ```json
    {
      "kind": "cat",
      "name": "Whiskers", 
      "meow": true
    }
    ```
    """)
  @put
  putNoEnvelope(@body input: PetInline): PetInline;
}
