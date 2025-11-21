import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { emitSchema } from "./utils.js";

describe("default behavior", () => {
  it("adds discriminator property to base model", async () => {
    const schemas = await emitSchema(`
        @discriminator("kind")
        model Pet {
          name: string;
        }

        model Cat extends Pet {
          kind: "cat";
          meow: int32;
        }

        model Dog extends Pet {
          kind: "dog";
          bark: string;
        }
      `);

    const petSchema = schemas["Pet.json"];
    ok(petSchema, "Pet schema should exist");
    deepStrictEqual(petSchema.properties.kind, {
      type: "string",
      description: "Discriminator property for Pet.",
    });
    strictEqual(petSchema.properties.name.type, "string");
    deepStrictEqual(petSchema.required, ["name", "kind"]);
  });

  it("derived models define discriminator with const value", async () => {
    const schemas = await emitSchema(`
        @discriminator("kind")
        model Pet {
          name: string;
        }

        model Cat extends Pet {
          kind: "cat";
          meow: int32;
        }

        model Dog extends Pet {
          kind: "dog";
          bark: string;
        }
      `);

    const catSchema = schemas["Cat.json"];
    ok(catSchema, "Cat schema should exist");
    deepStrictEqual(catSchema.properties.kind, {
      type: "string",
      const: "cat",
    });
    strictEqual(catSchema.properties.meow.type, "integer");
    deepStrictEqual(catSchema.allOf, [{ $ref: "Pet.json" }]);

    const dogSchema = schemas["Dog.json"];
    ok(dogSchema, "Dog schema should exist");
    deepStrictEqual(dogSchema.properties.kind, {
      type: "string",
      const: "dog",
    });
    strictEqual(dogSchema.properties.bark.type, "string");
    deepStrictEqual(dogSchema.allOf, [{ $ref: "Pet.json" }]);
  });

  it("works with union discriminator values", async () => {
    const schemas = await emitSchema(`
        union PetKind {
          cat: "cat-kind",
          dog: "dog-kind"
        }

        @discriminator("kind")
        model Pet {
          kind: PetKind;
        }

        model Cat extends Pet {
          kind: PetKind.cat;
          meow: int32;
        }

        model Dog extends Pet {
          kind: PetKind.dog;
          bark: string;
        }
      `);

    const petSchema = schemas["Pet.json"];
    ok(petSchema, "Pet schema should exist");

    // The discriminator property should reference the union or be defined
    ok(petSchema.properties.kind, "Pet should have kind property");

    const catSchema = schemas["Cat.json"];
    ok(catSchema, "Cat schema should exist");
    deepStrictEqual(catSchema.properties.kind, {
      type: "string",
      const: "cat-kind",
    });

    const dogSchema = schemas["Dog.json"];
    ok(dogSchema, "Dog schema should exist");
    deepStrictEqual(dogSchema.properties.kind, {
      type: "string",
      const: "dog-kind",
    });
  });

  it("supports multiple levels of inheritance", async () => {
    const schemas = await emitSchema(`
        @discriminator("kind")
        model Pet {
          name: string;
        }

        model Dog extends Pet {
          kind: "dog";
          bark: string;
        }

        model Beagle extends Dog {
          purebred: boolean;
        }
      `);

    const petSchema = schemas["Pet.json"];
    ok(petSchema, "Pet schema should exist");
    deepStrictEqual(petSchema.properties.kind, {
      type: "string",
      description: "Discriminator property for Pet.",
    });

    const dogSchema = schemas["Dog.json"];
    ok(dogSchema, "Dog schema should exist");
    deepStrictEqual(dogSchema.properties.kind, {
      type: "string",
      const: "dog",
    });
    deepStrictEqual(dogSchema.allOf, [{ $ref: "Pet.json" }]);

    const beagleSchema = schemas["Beagle.json"];
    ok(beagleSchema, "Beagle schema should exist");
    strictEqual(beagleSchema.properties.purebred.type, "boolean");
    deepStrictEqual(beagleSchema.allOf, [{ $ref: "Dog.json" }]);
  });

  it("doesn't add discriminator property if already explicitly defined", async () => {
    const schemas = await emitSchema(`
        @discriminator("kind")
        model Pet {
          name: string;
          kind: string;
        }

        model Cat extends Pet {
          kind: "cat";
          meow: int32;
        }
      `);

    const petSchema = schemas["Pet.json"];
    ok(petSchema, "Pet schema should exist");
    // Should use the explicitly defined property, not add description
    deepStrictEqual(petSchema.properties.kind, {
      type: "string",
    });
  });

  it("works with non-empty base model", async () => {
    const schemas = await emitSchema(`
        @discriminator("kind")
        model Pet {
          name: string;
          weight?: float32;
        }

        model Cat extends Pet {
          kind: "cat";
          meow: int32;
        }

        model Dog extends Pet {
          kind: "dog";
          bark: string;
        }
      `);

    const petSchema = schemas["Pet.json"];
    ok(petSchema, "Pet schema should exist");
    strictEqual(petSchema.properties.name.type, "string");
    strictEqual(petSchema.properties.weight.type, "number");
    deepStrictEqual(petSchema.properties.kind, {
      type: "string",
      description: "Discriminator property for Pet.",
    });
    deepStrictEqual(petSchema.required, ["name", "kind"]);
  });
});

describe("discriminated union with polymorphic-models-strategy option", () => {
  it("emits oneOf schema for base model with derived types", async () => {
    const schemas = await emitSchema(
      `
        @discriminator("kind")
        model Pet {
          name: string;
        }

        model Cat extends Pet {
          kind: "cat";
          meow: int32;
        }

        model Dog extends Pet {
          kind: "dog";
          bark: string;
        }
      `,
      { "polymorphic-models-strategy": "oneOf" },
    );

    const petSchema = schemas["Pet.json"];
    ok(petSchema, "Pet schema should exist");
    ok(petSchema.oneOf, "Pet schema should have oneOf");
    strictEqual(petSchema.oneOf.length, 2, "oneOf should have 2 options");
    deepStrictEqual(petSchema.oneOf[0], { $ref: "Cat.json" });
    deepStrictEqual(petSchema.oneOf[1], { $ref: "Dog.json" });

    // Pet schema should only contain oneOf (no properties to avoid circular refs)
    strictEqual(petSchema.type, undefined);
    strictEqual(petSchema.properties, undefined);
    strictEqual(petSchema.required, undefined);

    // Should not have discriminator keyword (discriminator is OpenAPI, not JSON Schema)
    strictEqual(petSchema.discriminator, undefined);
  });

  it("still emits derived models normally", async () => {
    const schemas = await emitSchema(
      `
        @discriminator("kind")
        model Pet {
          name: string;
        }

        model Cat extends Pet {
          kind: "cat";
          meow: int32;
        }

        model Dog extends Pet {
          kind: "dog";
          bark: string;
        }
      `,
      { "polymorphic-models-strategy": "oneOf" },
    );

    const catSchema = schemas["Cat.json"];
    ok(catSchema, "Cat schema should exist");
    strictEqual(catSchema.properties.kind.const, "cat");
    strictEqual(catSchema.properties.meow.type, "integer");
    // Cat should include base properties (name) inline to avoid circular refs
    strictEqual(catSchema.properties.name.type, "string");
    strictEqual(catSchema.allOf, undefined, "Should not have allOf to avoid circular refs");

    const dogSchema = schemas["Dog.json"];
    ok(dogSchema, "Dog schema should exist");
    strictEqual(dogSchema.properties.kind.const, "dog");
    strictEqual(dogSchema.properties.bark.type, "string");
    // Dog should include base properties (name) inline to avoid circular refs
    strictEqual(dogSchema.properties.name.type, "string");
    strictEqual(dogSchema.allOf, undefined, "Should not have allOf to avoid circular refs");
  });

  it("works with multiple levels of inheritance", async () => {
    const schemas = await emitSchema(
      `
        @discriminator("kind")
        model Pet {
          name: string;
        }

        model Dog extends Pet {
          kind: "dog";
          bark: string;
        }

        model Beagle extends Dog {
          purebred: boolean;
        }
      `,
      { "polymorphic-models-strategy": "oneOf" },
    );

    const petSchema = schemas["Pet.json"];
    ok(petSchema, "Pet schema should exist");
    ok(petSchema.oneOf, "Pet schema should have oneOf");
    strictEqual(petSchema.oneOf.length, 1, "oneOf should have 1 option (Dog)");
    deepStrictEqual(petSchema.oneOf[0], { $ref: "Dog.json" });

    const dogSchema = schemas["Dog.json"];
    ok(dogSchema, "Dog schema should exist");
    // Dog should inline Pet properties, not use allOf
    strictEqual(dogSchema.properties.name.type, "string");
    strictEqual(dogSchema.allOf, undefined, "Should not have allOf to avoid circular refs");
  });

  it("does not emit oneOf when option is ignore", async () => {
    const schemas = await emitSchema(
      `
        @discriminator("kind")
        model Pet {
          name: string;
        }

        model Cat extends Pet {
          kind: "cat";
          meow: int32;
        }
      `,
      { "polymorphic-models-strategy": "ignore" },
    );

    const petSchema = schemas["Pet.json"];
    ok(petSchema, "Pet schema should exist");
    strictEqual(petSchema.oneOf, undefined, "Should not have oneOf");
    strictEqual(petSchema.type, "object", "Should be object type");
    ok(petSchema.properties, "Should have properties");
  });

  it("does not emit oneOf for models without derived types", async () => {
    const schemas = await emitSchema(
      `
        @discriminator("kind")
        model Pet {
          name: string;
          kind: string;
        }
      `,
      { "polymorphic-models-strategy": "oneOf" },
    );

    const petSchema = schemas["Pet.json"];
    ok(petSchema, "Pet schema should exist");
    strictEqual(petSchema.oneOf, undefined, "Should not have oneOf");
    strictEqual(petSchema.type, "object", "Should be object type");
    ok(petSchema.properties, "Should have properties");
  });

  it("emits anyOf schema when strategy is anyOf", async () => {
    const schemas = await emitSchema(
      `
        @discriminator("kind")
        model Pet {
          name: string;
        }

        model Cat extends Pet {
          kind: "cat";
          meow: int32;
        }

        model Dog extends Pet {
          kind: "dog";
          bark: string;
        }
      `,
      { "polymorphic-models-strategy": "anyOf" },
    );

    const petSchema = schemas["Pet.json"];
    ok(petSchema, "Pet schema should exist");
    ok(petSchema.anyOf, "Pet schema should have anyOf");
    strictEqual(petSchema.anyOf.length, 2, "anyOf should have 2 options");
    deepStrictEqual(petSchema.anyOf[0], { $ref: "Cat.json" });
    deepStrictEqual(petSchema.anyOf[1], { $ref: "Dog.json" });

    // Pet schema should only contain anyOf (no properties to avoid circular refs)
    strictEqual(petSchema.type, undefined);
    strictEqual(petSchema.properties, undefined);
    strictEqual(petSchema.required, undefined);
    strictEqual(petSchema.oneOf, undefined, "Should not have oneOf");

    // Should not have discriminator keyword (discriminator is OpenAPI, not JSON Schema)
    strictEqual(petSchema.discriminator, undefined);
  });

  it("uses correct reference paths with emitAllModels", async () => {
    const schemas = await emitSchema(
      `
        @discriminator("kind")
        model Pet {
          name: string;
        }

        model Cat extends Pet {
          kind: "cat";
          meow: int32;
        }

        model Dog extends Pet {
          kind: "dog";
          bark: string;
        }
      `,
      { "polymorphic-models-strategy": "oneOf", emitAllModels: true },
    );

    const petSchema = schemas["Pet.json"];
    ok(petSchema, "Pet schema should exist");
    ok(petSchema.oneOf, "Pet schema should have oneOf");

    // All models emitted separately, so references point to separate files
    deepStrictEqual(petSchema.oneOf[0], { $ref: "Cat.json" });
    deepStrictEqual(petSchema.oneOf[1], { $ref: "Dog.json" });
  });

  it("uses #/$defs references when derived models are bundled", async () => {
    const schemas = await emitSchema(
      `
        @jsonSchema
        @discriminator("kind")
        model Pet {
          name: string;
        }

        model Cat extends Pet {
          kind: "cat";
          meow: int32;
        }

        model Dog extends Pet {
          kind: "dog";
          bark: string;
        }
      `,
      { "polymorphic-models-strategy": "oneOf" },
      { emitNamespace: false },
    );

    const petSchema = schemas["Pet.json"];
    ok(petSchema, "Pet schema should exist");
    ok(petSchema.oneOf, "Pet schema should have oneOf");

    // Verify the derived models are in $defs
    ok(petSchema.$defs?.Cat, "Cat should be in $defs");
    ok(petSchema.$defs?.Dog, "Dog should be in $defs");

    // References use #/$defs when models are bundled
    deepStrictEqual(petSchema.oneOf[0], { $ref: "#/$defs/Cat" });
    deepStrictEqual(petSchema.oneOf[1], { $ref: "#/$defs/Dog" });
  });
});
