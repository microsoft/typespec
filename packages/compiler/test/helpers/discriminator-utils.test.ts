import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { getDiscriminatedUnionFromInheritance } from "../../src/core/helpers/discriminator-utils.js";
import { Model, Program, getDiscriminator } from "../../src/index.js";
import {
  expectDiagnosticEmpty,
  expectDiagnostics,
  extractCursor,
  t,
} from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("compiler: discriminator", () => {
  function checkValidDiscriminatedUnion(program: Program, model: Model) {
    const discriminator = getDiscriminator(program, model);
    if (discriminator === undefined) {
      throw new Error("Discriminator shouldn't be undefined.");
    }
    const [union, diagnostics] = getDiscriminatedUnionFromInheritance(model, discriminator);
    expectDiagnosticEmpty(diagnostics);
    return union;
  }

  describe("inheritance based", () => {
    it("find variants from direct derived types", async () => {
      const { Pet, Cat, Dog, program } = await Tester.compile(t.code`
        @discriminator("kind")
        model ${t.model("Pet")} {}

        model ${t.model("Cat")} extends Pet {
          kind: "cat";
        }

        model ${t.model("Dog")} extends Pet {
          kind: "dog";
        }
      `);

      const union = checkValidDiscriminatedUnion(program, Pet);
      strictEqual(union.variants.size, 2);
      strictEqual(union.variants.get("cat"), Cat);
      strictEqual(union.variants.get("dog"), Dog);
    });

    it("doesn't include unrelated types", async () => {
      const { Pet, Cat, program } = await Tester.compile(t.code`
        @discriminator("kind")
        model ${t.model("Pet")} {}

        model ${t.model("Cat")} extends Pet {
          kind: "cat";
        }

        model Aligator {
          kind: "aligator";
        }
      `);

      const union = checkValidDiscriminatedUnion(program, Pet);
      strictEqual(union.variants.size, 1);
      strictEqual(union.variants.get("cat"), Cat);
      strictEqual(union.variants.get("aligator"), undefined);
    });

    it("can use a templated type for derived types", async () => {
      const { Pet, Cat, Dog, program } = await Tester.compile(t.code`
        @discriminator("kind")
        model ${t.model("Pet")} {}

        model PetT<T> extends Pet {
          kind: T;
        }

        model ${t.model("Cat")} is PetT<"cat"> {
        }

        model ${t.model("Dog")} is PetT<"dog">  {
        }
      `);

      const union = checkValidDiscriminatedUnion(program, Pet);
      strictEqual(union.variants.size, 2);
      strictEqual(union.variants.get("cat"), Cat);
      strictEqual(union.variants.get("dog"), Dog);
    });

    describe("discriminator value", () => {
      it("can be a string", async () => {
        const { Pet, Cat, program } = await Tester.compile(t.code`
        @discriminator("kind")
        model ${t.model("Pet")} {}

        model ${t.model("Cat")} extends Pet {
          kind: "cat";
        }
      `);

        const union = checkValidDiscriminatedUnion(program, Pet);
        strictEqual(union.variants.size, 1);
        strictEqual(union.variants.get("cat"), Cat);
      });

      it("can be a union of string", async () => {
        const { Pet, Cat, program } = await Tester.compile(t.code`
        @discriminator("kind")
        model ${t.model("Pet")} {}

        model ${t.model("Cat")} extends Pet {
          kind: "cat" | "feline";
        }
      `);

        const union = checkValidDiscriminatedUnion(program, Pet);
        strictEqual(union.variants.size, 2);
        strictEqual(union.variants.get("cat"), Cat);
        strictEqual(union.variants.get("feline"), Cat);
      });

      it("can be a string enum member", async () => {
        const { Pet, Cat, program } = await Tester.compile(t.code`
        @discriminator("kind")
        model ${t.model("Pet")} {}

        enum PetKind {cat}
        model ${t.model("Cat")} extends Pet {
          kind: PetKind.cat;
        }
      `);

        const union = checkValidDiscriminatedUnion(program, Pet);
        strictEqual(union.variants.size, 1);
        strictEqual(union.variants.get("cat"), Cat);
      });
    });

    it("find variants from nested derived types", async () => {
      const { Pet, Cat, program } = await Tester.compile(t.code`
        @discriminator("kind")
        model ${t.model("Pet")} {}

        model Feline extends Pet {}
        model ${t.model("Cat")} extends Feline {
          kind: "cat";
        }

      `);

      const union = checkValidDiscriminatedUnion(program, Pet);
      strictEqual(union.variants.size, 1);
      strictEqual(union.variants.get("cat"), Cat);
    });

    it("support nested discriminated types", async () => {
      const { Pet, Cat, Siamese, program } = await Tester.compile(t.code`
        @discriminator("kind")
        model ${t.model("Pet")} {}

        @discriminator("breed")
        model ${t.model("Cat")} extends Pet {
          kind: "cat";
        }

        @discriminator("breed")
        model ${t.model("Siamese")} extends Cat {
          breed: "siamese"
        }

      `);

      const petUnion = checkValidDiscriminatedUnion(program, Pet);
      strictEqual(petUnion.variants.size, 1);
      strictEqual(petUnion.variants.get("cat"), Cat);

      const catUnion = checkValidDiscriminatedUnion(program, Cat);
      strictEqual(catUnion.variants.size, 1);
      strictEqual(catUnion.variants.get("siamese"), Siamese);
    });

    it("support nested discriminated types with intermediate types", async () => {
      const { Pet, Cat, Siamese, program } = await Tester.compile(t.code`
        @discriminator("kind")
        model ${t.model("Pet")} {}

        model Feline extends Pet {}

        @discriminator("breed")
        model ${t.model("Cat")} extends Feline {
          kind: "cat";
        }

        model IndoorCat extends Cat {}

        @discriminator("breed")
        model ${t.model("Siamese")} extends IndoorCat {
          breed: "siamese"
        }

      `);

      const petUnion = checkValidDiscriminatedUnion(program, Pet);
      strictEqual(petUnion.variants.size, 1);
      strictEqual(petUnion.variants.get("cat"), Cat);

      const catUnion = checkValidDiscriminatedUnion(program, Cat);
      strictEqual(catUnion.variants.size, 1);
      strictEqual(catUnion.variants.get("siamese"), Siamese);
    });

    it("errors if discriminator property is not a string-like type", async () => {
      const diagnostics = await Tester.diagnose(`
        @discriminator("kind")
        model Pet {}

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
      const diagnostics = await Tester.diagnose(`
        @discriminator("kind")
        model Pet {}

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
      const diagnostics = await Tester.diagnose(`
        @discriminator("kind")
        model Pet {}

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
      model Pet {}

      // No error has there is a derived type(Cat)
      model Feline extends Pet {}
      // Error 1
      ┆model Cat extends Feline {}
      // Error 2
      ┆model Dog extends Pet{}
    `));
      ({ pos: dogPos, source } = extractCursor(source));
      const diagnostics = await Tester.diagnose(source);

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
});
