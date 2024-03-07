import { strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { Model, getDiscriminatedUnion, getDiscriminator } from "../../src/index.js";
import {
  BasicTestRunner,
  createTestRunner,
  expectDiagnosticEmpty,
  expectDiagnostics,
  extractCursor,
} from "../../src/testing/index.js";

describe("compiler: discriminator", () => {
  let runner: BasicTestRunner;
  beforeEach(async () => {
    runner = await createTestRunner();
  });

  function checkValidDiscriminatedUnion(model: Model) {
    const discriminator = getDiscriminator(runner.program, model);
    if (discriminator === undefined) {
      throw new Error("Discriminator shouldn't be undefined.");
    }
    const [union, diagnostics] = getDiscriminatedUnion(model, discriminator);
    expectDiagnosticEmpty(diagnostics);
    return union;
  }

  describe("inheritance based", () => {
    it("find variants from direct derived types", async () => {
      const { Pet, Cat, Dog } = (await runner.compile(`
        @discriminator("kind")
        @test model Pet {}

        @test model Cat extends Pet {
          kind: "cat";
        }

        @test model Dog extends Pet {
          kind: "dog";
        }
      `)) as { Pet: Model; Cat: Model; Dog: Model };

      const union = checkValidDiscriminatedUnion(Pet);
      strictEqual(union.variants.size, 2);
      strictEqual(union.variants.get("cat"), Cat);
      strictEqual(union.variants.get("dog"), Dog);
    });

    it("doesn't include unrelated types", async () => {
      const { Pet, Cat } = (await runner.compile(`
        @discriminator("kind")
        @test model Pet {}

        @test model Cat extends Pet {
          kind: "cat";
        }

        @test model Aligator {
          kind: "aligator";
        }
      `)) as { Pet: Model; Cat: Model };

      const union = checkValidDiscriminatedUnion(Pet);
      strictEqual(union.variants.size, 1);
      strictEqual(union.variants.get("cat"), Cat);
      strictEqual(union.variants.get("aligator"), undefined);
    });

    it("can use a templated type for derived types", async () => {
      const { Pet, Cat, Dog } = (await runner.compile(`
        @discriminator("kind")
        @test model Pet {}

        model PetT<T> extends Pet {
          kind: T;
        }

        @test model Cat is PetT<"cat"> {
        }

        @test model Dog is PetT<"dog">  {
        }
      `)) as { Pet: Model; Cat: Model; Dog: Model };

      const union = checkValidDiscriminatedUnion(Pet);
      strictEqual(union.variants.size, 2);
      strictEqual(union.variants.get("cat"), Cat);
      strictEqual(union.variants.get("dog"), Dog);
    });

    describe("discriminator value", () => {
      it("can be a string", async () => {
        const { Pet, Cat } = (await runner.compile(`
        @discriminator("kind")
        @test model Pet {}

        @test model Cat extends Pet {
          kind: "cat";
        }
      `)) as { Pet: Model; Cat: Model; Dog: Model };

        const union = checkValidDiscriminatedUnion(Pet);
        strictEqual(union.variants.size, 1);
        strictEqual(union.variants.get("cat"), Cat);
      });

      it("can be a union of string", async () => {
        const { Pet, Cat } = (await runner.compile(`
        @discriminator("kind")
        @test model Pet {}

        @test model Cat extends Pet {
          kind: "cat" | "feline";
        }
      `)) as { Pet: Model; Cat: Model; Dog: Model };

        const union = checkValidDiscriminatedUnion(Pet);
        strictEqual(union.variants.size, 2);
        strictEqual(union.variants.get("cat"), Cat);
        strictEqual(union.variants.get("feline"), Cat);
      });

      it("can be a string enum member", async () => {
        const { Pet, Cat } = (await runner.compile(`
        @discriminator("kind")
        @test model Pet {}

        enum PetKind {cat}
        @test model Cat extends Pet {
          kind: PetKind.cat;
        }
      `)) as { Pet: Model; Cat: Model; Dog: Model };

        const union = checkValidDiscriminatedUnion(Pet);
        strictEqual(union.variants.size, 1);
        strictEqual(union.variants.get("cat"), Cat);
      });
    });

    it("find variants from nested derived types", async () => {
      const { Pet, Cat } = (await runner.compile(`
        @discriminator("kind")
        @test model Pet {}

        @test model Feline extends Pet {}
        @test model Cat extends Feline {
          kind: "cat";
        }

      `)) as { Pet: Model; Cat: Model; Dog: Model };

      const union = checkValidDiscriminatedUnion(Pet);
      strictEqual(union.variants.size, 1);
      strictEqual(union.variants.get("cat"), Cat);
    });

    it("support nested discriminated types", async () => {
      const { Pet, Cat, Siamese } = (await runner.compile(`
        @discriminator("kind")
        @test model Pet {}

        @discriminator("breed")
        @test model Cat extends Pet {
          kind: "cat";
        }

        @discriminator("breed")
        @test model Siamese extends Cat {
          breed: "siamese"
        }

      `)) as { Pet: Model; Cat: Model; Siamese: Model };

      const petUnion = checkValidDiscriminatedUnion(Pet);
      strictEqual(petUnion.variants.size, 1);
      strictEqual(petUnion.variants.get("cat"), Cat);

      const catUnion = checkValidDiscriminatedUnion(Cat);
      strictEqual(catUnion.variants.size, 1);
      strictEqual(catUnion.variants.get("siamese"), Siamese);
    });

    it("support nested discriminated types with intermediate types", async () => {
      const { Pet, Cat, Siamese } = (await runner.compile(`
        @discriminator("kind")
        @test model Pet {}

        model Feline extends Pet {}

        @discriminator("breed")
        @test model Cat extends Feline {
          kind: "cat";
        }

        model IndoorCat extends Cat {}

        @discriminator("breed")
        @test model Siamese extends IndoorCat {
          breed: "siamese"
        }

      `)) as { Pet: Model; Cat: Model; Siamese: Model };

      const petUnion = checkValidDiscriminatedUnion(Pet);
      strictEqual(petUnion.variants.size, 1);
      strictEqual(petUnion.variants.get("cat"), Cat);

      const catUnion = checkValidDiscriminatedUnion(Cat);
      strictEqual(catUnion.variants.size, 1);
      strictEqual(catUnion.variants.get("siamese"), Siamese);
    });

    it("errors if discriminator property is not a string-like type", async () => {
      const diagnostics = await runner.diagnose(`
        @discriminator("kind")
        @test model Pet {}

        model Cat extends Pet {
          kind: int32;
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-discriminator-value",
        message:
          "Discriminator value should be a string, union of string or string enum but was Scalar.",
      });
    });

    it("errors if discriminator property is optional", async () => {
      const diagnostics = await runner.diagnose(`
        @discriminator("kind")
        @test model Pet {}

        model Cat extends Pet {
          kind?: "cat";
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-discriminator-value",
        message: "The discriminator property must be a required property.",
      });
    });

    it("errors if discriminator value are duplicated", async () => {
      const diagnostics = await runner.diagnose(`
        @discriminator("kind")
        @test model Pet {}

        model Cat extends Pet {
          kind: "cat";
        }

        model Lion extends Pet {
          kind: "cat";
        }
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "invalid-discriminator-value",
          message: `Discriminator value "cat" is already used in another variant.`,
        },
        {
          code: "invalid-discriminator-value",
          message: `Discriminator value "cat" is already used in another variant.`,
        },
      ]);
    });

    it("errors if discriminator property is missing and model has no derived types", async () => {
      let catPos: number;
      let dogPos: number;
      let source: string;
      ({ pos: catPos, source } = extractCursor(`
      @discriminator("kind")
      @test model Pet {}

      // No error has there is a derived type(Cat)
      model Feline extends Pet {}
      // Error 1
      ┆model Cat extends Feline {}
      // Error 2
      ┆model Dog extends Pet{}
    `));
      ({ pos: dogPos, source } = extractCursor(source));
      const diagnostics = await runner.diagnose(source);

      expectDiagnostics(diagnostics, [
        {
          code: "missing-discriminator-property",
          message: `Each derived model of a discriminated model type should have set the discriminator property("kind") or have a derived model which has. Add \`kind: "<discriminator-value>"\``,
          pos: catPos,
        },
        {
          code: "missing-discriminator-property",
          message: `Each derived model of a discriminated model type should have set the discriminator property("kind") or have a derived model which has. Add \`kind: "<discriminator-value>"\``,
          pos: dogPos,
        },
      ]);
    });
  });

  describe("union based", () => {
    it("find variants from direct derived types", async () => {
      const { Pet, Cat, Dog } = (await runner.compile(`
        @discriminator("kind")
        @test union Pet {
          cat: Cat;
          dog: Dog;
        }

        @test model Cat  {
          kind: "cat";
        }

        @test model Dog {
          kind: "dog";
        }
      `)) as { Pet: Model; Cat: Model; Dog: Model };

      const union = checkValidDiscriminatedUnion(Pet);
      strictEqual(union.variants.size, 2);
      strictEqual(union.variants.get("cat"), Cat);
      strictEqual(union.variants.get("dog"), Dog);
    });

    it("errors if discriminator property is not a string-like type", async () => {
      const diagnostics = await runner.diagnose(`
        @discriminator("kind")
        union Pet { cat: Cat }

        model Cat  {
          kind: int32;
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-discriminated-union-variant",
        message: `Variant "cat" type's discriminant property "kind" must be a string literal or string enum member.`,
      });
    });

    it("errors if discriminator property is optional", async () => {
      const diagnostics = await runner.diagnose(`
        @discriminator("kind")
        union Pet { cat: Cat }

        model Cat {
          kind?: "cat";
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-discriminator-value",
        message: "The discriminator property must be a required property.",
      });
    });

    it("errors if discriminator value are duplicated", async () => {
      const diagnostics = await runner.diagnose(`
        @discriminator("kind")
        union Pet { cat: Cat, lion: Lion }

        model Cat {
          kind: "cat";
        }

        model Lion {
          kind: "cat";
        }
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "invalid-discriminator-value",
          message: `Discriminator value "cat" is already used in another variant.`,
        },
        {
          code: "invalid-discriminator-value",
          message: `Discriminator value "cat" is already used in another variant.`,
        },
      ]);
    });

    it("errors if discriminator property is missing", async () => {
      const { pos: catPos, source } = extractCursor(`
        @discriminator("kind")
        union Pet { ┆cat: Cat }

        model Cat {}
      `);
      const diagnostics = await runner.diagnose(source);
      expectDiagnostics(diagnostics, [
        {
          code: "invalid-discriminated-union-variant",
          message: `Variant "cat" type is missing the discriminant property "kind".`,
          pos: catPos,
        },
      ]);
    });
  });
});
