import { strictEqual } from "assert";
import { getDiscriminatedUnion, getDiscriminator, Model } from "../../core/index.js";
import {
  BasicTestRunner,
  createTestRunner,
  expectDiagnosticEmpty,
  expectDiagnostics,
  extractCursor,
} from "../../testing/index.js";

describe("compiler: discriminator", () => {
  let runner: BasicTestRunner;
  beforeEach(async () => {
    runner = await createTestRunner();
  });

  function resolveDiscriminatedUnion(model: Model) {
    const discriminator = getDiscriminator(runner.program, model);
    if (discriminator === undefined) {
      throw new Error("Discriminator shouldn't be undefined.");
    }
    return getDiscriminatedUnion(model, discriminator);
  }

  function checkValidDiscriminatedUnion(model: Model) {
    const [union, diagnostics] = resolveDiscriminatedUnion(model);
    expectDiagnosticEmpty(diagnostics);
    return union;
  }
  function diagnoseDiscriminatedUnion(model: Model) {
    const [, diagnostics] = resolveDiscriminatedUnion(model);
    return diagnostics;
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
      const { Pet } = (await runner.compile(`
        @discriminator("kind")
        @test model Pet {}

        model Cat extends Pet {
          kind: int32;
        }
      `)) as { Pet: Model };

      const diagnostics = diagnoseDiscriminatedUnion(Pet);
      expectDiagnostics(diagnostics, {
        code: "invalid-discriminator-value",
        message:
          "Discriminator value should be a string, union of string or string enum but was Model.",
      });
    });

    it("errors if discriminator property is optional", async () => {
      const { Pet } = (await runner.compile(`
        @discriminator("kind")
        @test model Pet {}

        model Cat extends Pet {
          kind?: "cat";
        }
      `)) as { Pet: Model };

      const diagnostics = diagnoseDiscriminatedUnion(Pet);
      expectDiagnostics(diagnostics, {
        code: "invalid-discriminator-value",
        message: "The discriminator property must be a required property.",
      });
    });

    it("errors if discriminator value are duplicated", async () => {
      const { Pet } = (await runner.compile(`
        @discriminator("kind")
        @test model Pet {}

        model Cat extends Pet {
          kind: "cat";
        }

        model Lion extends Pet {
          kind: "cat";
        }
      `)) as { Pet: Model };

      const diagnostics = diagnoseDiscriminatedUnion(Pet);
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
      const { Pet } = (await runner.compile(source)) as { Pet: Model };

      const diagnostics = diagnoseDiscriminatedUnion(Pet);
      expectDiagnostics(diagnostics, [
        {
          code: "missing-discriminator-value",
          message: `Each derived model of a discriminated model type should have set the discriminator property("kind") or have a derived model which has. Add \`kind: "<discriminator-value>"\``,
          pos: catPos,
        },
        {
          code: "missing-discriminator-value",
          message: `Each derived model of a discriminated model type should have set the discriminator property("kind") or have a derived model which has. Add \`kind: "<discriminator-value>"\``,
          pos: dogPos,
        },
      ]);
    });
  });
});
