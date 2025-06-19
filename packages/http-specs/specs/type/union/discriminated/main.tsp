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

// Base model for inheritance scenarios
model Pet {
  name: string;
}

// Models with inheritance
model CatWithInheritance extends Pet {
  meow: boolean;
}

model DogWithInheritance extends Pet {
  bark: boolean;
}

// Models with potential discriminator property conflicts
model CatWithConflict {
  name: string;
  meow: boolean;
  kind: "cat"; // Fixed value that matches the discriminator
}

model DogWithConflict {
  name: string;
  bark: boolean;
  kind: "dog"; // Fixed value that matches the discriminator
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

    @route("/inheritance")
    interface Inheritance {
      @scenario
      @scenarioDoc("""
        Test discriminated union with model inheritance (envelope).
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
      getInheritance(@query kind?: string): PetWithInheritanceEnvelope;

      @scenario
      @scenarioDoc("""
        Test discriminated union with model inheritance (envelope).
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
      putInheritance(@body input: PetWithInheritanceEnvelope): PetWithInheritanceEnvelope;
    }

    @route("/conflict")
    interface Conflict {
      @scenario
      @scenarioDoc("""
        Test discriminated union with property name conflicts (envelope).
        When value of query parameter "kind" is "cat" or no query parameter input, the expected response is:
        ```json
        {
          "kind": "cat",
          "value": {
            "name": "Whiskers",
            "meow": true,
            "kind": "cat"
          }
        }
        ```
        When it is "dog", expected response is:
        ```json
        {
          "kind": "dog",
          "value": {
            "name": "Rex",
            "bark": false,
            "kind": "dog"
          }
        }
        ```
        """)
      @get
      getConflict(@query kind?: string): PetWithConflictEnvelope;

      @scenario
      @scenarioDoc("""
        Test discriminated union with property name conflicts (envelope).
        Send the union as:
        ```json
        {
          "kind": "cat",
          "value": {
            "name": "Whiskers",
            "meow": true,
            "kind": "cat"
          }
        }
        ```
        """)
      @put
      putConflict(@body input: PetWithConflictEnvelope): PetWithConflictEnvelope;
    }
  }
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

/**
 * Test discriminated union with inheritance (envelope).
 * Models extend a base Pet model.
 */
@discriminated
union PetWithInheritanceEnvelope {
  cat: CatWithInheritance,
  dog: DogWithInheritance,
}

/**
 * Test discriminated union with property name conflicts (envelope).
 * Models have their own "kind" property that conflicts with discriminator.
 */
@discriminated
union PetWithConflictEnvelope {
  cat: CatWithConflict,
  dog: DogWithConflict,
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

/**
 * Test discriminated union with inline discriminator and custom discriminator property name.
 * The discriminated union should serialize with custom discriminator property
 * injected directly into the variant object.
 */
@discriminated(#{ envelope: "none", discriminatorPropertyName: "type" })
union PetInlineWithCustomDiscriminator {
  cat: Cat,
  dog: Dog,
}

/**
 * Test discriminated union with inheritance (no envelope).
 * Models extend a base Pet model with inline discriminator.
 */
@discriminated(#{ envelope: "none" })
union PetWithInheritanceInline {
  cat: CatWithInheritance,
  dog: DogWithInheritance,
}

/**
 * Test discriminated union with property name conflicts (no envelope).
 * Models have their own "kind" property that conflicts with discriminator.
 */
@discriminated(#{ envelope: "none" })
union PetWithConflictInline {
  cat: CatWithConflict,
  dog: DogWithConflict,
}

@route("/no-envelope")
namespace NoEnvelope {
  @route("/default")
  interface Default {
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
    getDefault(@query kind?: string): PetInline;

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
    putDefault(@body input: PetInline): PetInline;
  }

  @route("/custom-discriminator")
  interface CustomDiscriminator {
    @scenario
    @scenarioDoc("""
      Test discriminated union with inline discriminator and custom discriminator property name.
      When value of query parameter "type" is "cat" or no query parameter input, the expected response is:
      ```json
      {
        "type": "cat",
        "name": "Whiskers",
        "meow": true
      }
      ```
      When it is "dog", expected response is:
      ```json
      {
        "type": "dog",
        "name": "Rex",
        "bark": false
      }
      ```
      """)
    @get
    getCustomDiscriminator(@query type?: string): PetInlineWithCustomDiscriminator;

    @scenario
    @scenarioDoc("""
      Test discriminated union with inline discriminator and custom discriminator property name.
      Send the union as:
      ```json
      {
        "type": "cat",
        "name": "Whiskers", 
        "meow": true
      }
      ```
      """)
    @put
    putCustomDiscriminator(
      @body input: PetInlineWithCustomDiscriminator,
    ): PetInlineWithCustomDiscriminator;
  }

  @route("/inheritance")
  interface Inheritance {
    @scenario
    @scenarioDoc("""
      Test discriminated union with model inheritance (no envelope).
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
    getInheritance(@query kind?: string): PetWithInheritanceInline;

    @scenario
    @scenarioDoc("""
      Test discriminated union with model inheritance (no envelope).
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
    putInheritance(@body input: PetWithInheritanceInline): PetWithInheritanceInline;
  }

  @route("/conflict")
  interface Conflict {
    @scenario
    @scenarioDoc("""
      Test discriminated union with property name conflicts (no envelope).
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
    getConflict(@query kind?: string): PetWithConflictInline;

    @scenario
    @scenarioDoc("""
      Test discriminated union with property name conflicts (no envelope).
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
    putConflict(@body input: PetWithConflictInline): PetWithConflictInline;
  }
}
