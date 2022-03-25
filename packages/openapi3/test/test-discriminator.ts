import { ModelType, ModelTypeProperty } from "@cadl-lang/compiler";
import { expectDiagnostics } from "@cadl-lang/compiler/testing";
import { deepStrictEqual, match, ok, strictEqual } from "assert";
import { checkFor, createOpenAPITestRunner, openApiFor } from "./test-host.js";

describe("openapi3: discriminated unions", () => {
  it("emit diagnostics if not used on model or property", async () => {
    const runner = await createOpenAPITestRunner();
    const diagnostics = await runner.diagnose(`
      @discriminator("kind")
      namespace Foo {}
    `);
    expectDiagnostics(diagnostics, {
      code: "decorator-wrong-target",
      message: "Cannot apply @discriminator decorator to Namespace",
    });
  });

  it("defines unions with discriminators", async () => {
    const openApi = await openApiFor(`
      @discriminator("kind")
      model Pet { }
      model Cat extends Pet {
        kind: "cat";
        meow: int32;
      }
      model Dog extends Pet {
        kind: "dog";
        bark: string;
      }

      @route("/")
      namespace root {
        op read(): { @body body: Pet };
      }
      `);
    ok(openApi.components.schemas.Pet, "expected definition named Pet");
    ok(openApi.components.schemas.Cat, "expected definition named Cat");
    ok(openApi.components.schemas.Dog, "expected definition named Dog");
    deepStrictEqual(openApi.paths["/"].get.responses["200"].content["application/json"].schema, {
      $ref: "#/components/schemas/Pet",
    });
    deepStrictEqual(openApi.components.schemas.Pet, {
      type: "object",
      properties: {
        kind: {
          type: "string",
          description: "Discriminator property for Pet.",
        },
      },
      discriminator: {
        propertyName: "kind",
        mapping: {
          cat: "#/components/schemas/Cat",
          dog: "#/components/schemas/Dog",
        },
      },
    });
    deepStrictEqual(openApi.components.schemas.Cat.allOf, [{ $ref: "#/components/schemas/Pet" }]);
    deepStrictEqual(openApi.components.schemas.Dog.allOf, [{ $ref: "#/components/schemas/Pet" }]);
  });

  it("defines discriminated unions with non-empty base type", async () => {
    const openApi = await openApiFor(`
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

      @route("/")
      namespace root {
        op read(): { @body body: Pet };
      }
      `);
    ok(openApi.components.schemas.Pet, "expected definition named Pet");
    ok(openApi.components.schemas.Cat, "expected definition named Cat");
    ok(openApi.components.schemas.Dog, "expected definition named Dog");
    deepStrictEqual(openApi.paths["/"].get.responses["200"].content["application/json"].schema, {
      $ref: "#/components/schemas/Pet",
    });
    deepStrictEqual(openApi.components.schemas.Pet, {
      type: "object",
      properties: {
        kind: {
          type: "string",
          description: "Discriminator property for Pet.",
        },
        name: { type: "string" },
        weight: { type: "number", format: "float" },
      },
      required: ["name"],
      discriminator: {
        propertyName: "kind",
        mapping: {
          cat: "#/components/schemas/Cat",
          dog: "#/components/schemas/Dog",
        },
      },
    });
    deepStrictEqual(openApi.components.schemas.Cat.allOf, [{ $ref: "#/components/schemas/Pet" }]);
    deepStrictEqual(openApi.components.schemas.Dog.allOf, [{ $ref: "#/components/schemas/Pet" }]);
  });

  it("defines discriminated unions with discriminator property in base type", async () => {
    const openApi = await openApiFor(`
    @discriminator("kind")
    model Pet {
      kind: "cat" | "dog";
      name: string;
    }
    #suppress "@cadl-lang/openapi3/discriminator-value" "need to do this"
    model Cat extends Pet {
      meow: int32;
    }
    #suppress "@cadl-lang/openapi3/discriminator-value" "need to do this"
    model Dog extends Pet {
      bark: string;
    }

    @route("/")
    namespace root {
      op read(): { @body body: Pet };
    }
    `);
    ok(openApi.components.schemas.Pet, "expected definition named Pet");
    ok(openApi.components.schemas.Cat, "expected definition named Cat");
    ok(openApi.components.schemas.Dog, "expected definition named Dog");
    deepStrictEqual(openApi.paths["/"].get.responses["200"].content["application/json"].schema, {
      $ref: "#/components/schemas/Pet",
    });
    deepStrictEqual(openApi.components.schemas.Pet, {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["cat", "dog"], "x-cadl-name": "cat | dog" },
        name: { type: "string" },
      },
      required: ["kind", "name"],
      discriminator: { propertyName: "kind" },
    });
    deepStrictEqual(openApi.components.schemas.Cat.allOf, [{ $ref: "#/components/schemas/Pet" }]);
    deepStrictEqual(openApi.components.schemas.Dog.allOf, [{ $ref: "#/components/schemas/Pet" }]);
  });

  it("defines discriminated unions with more than one level of inheritance", async () => {
    const openApi = await openApiFor(`
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
      model Beagle extends Dog {
        purebred: boolean;
      }

      @route("/")
      namespace root {
        op read(): { @body body: Pet };
      }
      `);
    ok(openApi.components.schemas.Pet, "expected definition named Pet");
    ok(openApi.components.schemas.Cat, "expected definition named Cat");
    ok(openApi.components.schemas.Dog, "expected definition named Dog");
    ok(openApi.components.schemas.Beagle, "expected definition named Beagle");
    deepStrictEqual(openApi.paths["/"].get.responses["200"].content["application/json"].schema, {
      $ref: "#/components/schemas/Pet",
    });
    deepStrictEqual(openApi.components.schemas.Pet, {
      type: "object",
      properties: {
        name: { type: "string" },
        kind: {
          type: "string",
          description: "Discriminator property for Pet.",
        },
        weight: { type: "number", format: "float" },
      },
      required: ["name"],
      discriminator: {
        propertyName: "kind",
        mapping: {
          cat: "#/components/schemas/Cat",
          dog: "#/components/schemas/Dog",
        },
      },
    });
    deepStrictEqual(openApi.components.schemas.Cat.allOf, [{ $ref: "#/components/schemas/Pet" }]);
    deepStrictEqual(openApi.components.schemas.Dog.allOf, [{ $ref: "#/components/schemas/Pet" }]);
    deepStrictEqual(openApi.components.schemas.Beagle.allOf, [
      { $ref: "#/components/schemas/Dog" },
    ]);
  });

  it("defines nested discriminated unions", async () => {
    const openApi = await openApiFor(`
      @discriminator("kind")
      model Pet {
        name: string;
        weight?: float32;
      }
      model Cat extends Pet {
        kind: "cat";
        meow: int32;
      }
      @discriminator("breed")
      model Dog extends Pet {
        kind: "dog";
        bark: string;
      }
      #suppress "@cadl-lang/openapi3/discriminator-value" "kind defined in parent"
      model Beagle extends Dog {
        breed: "beagle";
      }
      #suppress "@cadl-lang/openapi3/discriminator-value" "kind defined in parent"
      model Poodle extends Dog {
        breed: "poodle";
      }

      @route("/")
      namespace root {
        op read(): { @body body: Pet };
      }
      `);
    ok(openApi.components.schemas.Pet, "expected definition named Pet");
    ok(openApi.components.schemas.Cat, "expected definition named Cat");
    ok(openApi.components.schemas.Dog, "expected definition named Dog");
    ok(openApi.components.schemas.Beagle, "expected definition named Beagle");
    ok(openApi.components.schemas.Poodle, "expected definition named Poodle");
    deepStrictEqual(openApi.paths["/"].get.responses["200"].content["application/json"].schema, {
      $ref: "#/components/schemas/Pet",
    });
    deepStrictEqual(openApi.components.schemas.Pet, {
      type: "object",
      properties: {
        kind: {
          type: "string",
          description: "Discriminator property for Pet.",
        },
        name: { type: "string" },
        weight: { type: "number", format: "float" },
      },
      required: ["name"],
      discriminator: {
        propertyName: "kind",
        mapping: {
          cat: "#/components/schemas/Cat",
          dog: "#/components/schemas/Dog",
        },
      },
    });
    deepStrictEqual(openApi.components.schemas.Dog, {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["dog"] },
        breed: {
          type: "string",
          description: "Discriminator property for Dog.",
        },
        bark: { type: "string" },
      },
      required: ["kind", "bark"],
      allOf: [{ $ref: "#/components/schemas/Pet" }],
      discriminator: {
        propertyName: "breed",
        mapping: {
          beagle: "#/components/schemas/Beagle",
          poodle: "#/components/schemas/Poodle",
        },
      },
    });
    deepStrictEqual(openApi.components.schemas.Beagle.allOf, [
      { $ref: "#/components/schemas/Dog" },
    ]);
    deepStrictEqual(openApi.components.schemas.Poodle.allOf, [
      { $ref: "#/components/schemas/Dog" },
    ]);
  });

  it("adds mapping entries to the discriminator when appropriate", async () => {
    const openApi = await openApiFor(`
      @discriminator("kind")
      model Pet { }
      model Cat extends Pet {
        kind: "cat" | "feline";
        meow: int32;
      }
      model Dog extends Pet {
        kind: "dog";
        bark: string;
      }
      #suppress "@cadl-lang/openapi3/discriminator-value" "need to do this"
      model Lizard extends Pet {
        kind: string;
      }

      @route("/")
      namespace root {
        op read(): { @body body: Pet };
      }
      `);
    ok(openApi.components.schemas.Pet, "expected definition named Pet");
    ok(openApi.components.schemas.Cat, "expected definition named Cat");
    ok(openApi.components.schemas.Dog, "expected definition named Dog");
    ok(openApi.components.schemas.Lizard, "expected definition named Lizard");
    deepStrictEqual(openApi.paths["/"].get.responses["200"].content["application/json"].schema, {
      $ref: "#/components/schemas/Pet",
    });
    deepStrictEqual(openApi.components.schemas.Pet, {
      type: "object",
      properties: {
        kind: {
          type: "string",
          description: "Discriminator property for Pet.",
        },
      },
      discriminator: {
        propertyName: "kind",
        mapping: {
          cat: "#/components/schemas/Cat",
          dog: "#/components/schemas/Dog",
          feline: "#/components/schemas/Cat",
        },
      },
    });
  });

  it("issues diagnostics for errors in a discriminated union", async () => {
    const diagnostics = await checkFor(`
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
        petType: "dog";
        bark: string;
      }
      model Pig extends Pet {
        kind: int32;
        oink: float32;
      }
      model Tiger extends Pet {
        kind?: "tiger";
        claws: float32;
      }
      model Lizard extends Pet {
        kind: string;
        tail: float64;
      }

      @route("/")
      namespace root {
        op read(): { @body body: Pet };
      }
      `);
    strictEqual(diagnostics.length, 6);
    strictEqual((diagnostics[0].target as ModelType).name, "Dog");
    match(diagnostics[0].message, /not defined in a variant of a discriminated union/);
    strictEqual((diagnostics[1].target as ModelTypeProperty).name, "kind"); // Pig.kind
    match(diagnostics[1].message, /must be type 'string'/);
    strictEqual((diagnostics[2].target as ModelTypeProperty).name, "kind"); // Tiger.kind
    match(diagnostics[2].message, /must be a required property/);
    strictEqual((diagnostics[3].target as ModelType).name, "Dog");
    match(diagnostics[3].message, /define the discriminator property with a string literal value/);
    match(diagnostics[4].message, /define the discriminator property with a string literal value/); // Pig.kind
    match(diagnostics[5].message, /define the discriminator property with a string literal value/); // Lizard.kind
  });

  it("issues diagnostics for duplicate discriminator values", async () => {
    const diagnostics = await checkFor(`
      @discriminator("kind")
      model Pet {
      }
      model Cat extends Pet {
        kind: "cat" | "feline" | "housepet";
        meow: int32;
      }
      model Dog extends Pet {
        kind: "dog" | "housepet";
        bark: string;
      }
      model Beagle extends Pet {
        kind: "dog";
        bark: string;
      }

      @route("/")
      namespace root {
        op read(): { @body body: Pet };
      }
      `);
    strictEqual(diagnostics.length, 2);
    match(diagnostics[0].message, /"housepet" defined in two different variants: Cat and Dog/);
    match(diagnostics[1].message, /"dog" defined in two different variants: Dog and Beagle/);
  });
});
