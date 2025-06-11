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
  cat: Cat,
  dog: Dog,
}

@route("/envelope")
interface EnvelopeDiscriminated {
  @scenario
  @scenarioDoc("""
    Test discriminated union with envelope serialization.
    The union should serialize as:
    ```json
    {
      "kind": "cat",
      "value": {
        "name": "Whiskers",
        "meow": true
      }
    }
    ```
    When kind is null or "cat", return response for "cat".
    When kind is "dog", return response for "dog".
    """)
  @get
  getEnvelope(@query kind?: string): PetWithEnvelope;

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
  putEnvelope(@body input: PetWithEnvelope): PetWithEnvelope;
}

/**
 * Test discriminated union with custom property names.
 * The discriminated union should serialize with custom discriminator
 * and envelope property names.
 */
@discriminated(#{ discriminatorPropertyName: "petType", envelopePropertyName: "petData" })
union PetWithCustomNames {
  cat: Cat,
  dog: Dog,
}

@route("/custom-names")
interface CustomNamesDiscriminated {
  @scenario
  @scenarioDoc("""
    Test discriminated union with custom property names.
    The union should serialize as:
    ```json
    {
      "petType": "cat",
      "petData": {
        "name": "Whiskers", 
        "meow": true
      }
    }
    ```
    When petType is null or "cat", return response for "cat".
    When petType is "dog", return response for "dog".
    """)
  @get
  getCustomNames(@query petType?: string): PetWithCustomNames;

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
  putCustomNames(@body input: PetWithCustomNames): PetWithCustomNames;
}

/**
 * Test discriminated union with inline discriminator (no envelope).
 * The discriminated union should serialize with discriminator property
 * injected directly into the variant object.
 */
@discriminated(#{ envelope: "none" })
union PetInline {
  cat: Cat,
  dog: Dog,
}

@route("/inline")
interface InlineDiscriminated {
  @scenario
  @scenarioDoc("""
    Test discriminated union with inline discriminator.
    The union should serialize as:
    ```json
    {
      "kind": "cat",
      "name": "Whiskers",
      "meow": true
    }
    ```
    When kind is null or "cat", return response for "cat".
    When kind is "dog", return response for "dog".
    """)
  @get
  getInline(@query kind?: string): PetInline;

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
  putInline(@body input: PetInline): PetInline;
}
