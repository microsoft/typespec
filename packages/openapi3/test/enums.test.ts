import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, strictEqual } from "assert";
import { describe, it } from "vitest";
import { supportedVersions, worksFor } from "./works-for.js";

worksFor(supportedVersions, ({ diagnoseOpenApiFor, oapiForModel }) => {
  it("throws diagnostics for empty enum definitions", async () => {
    const diagnostics = await diagnoseOpenApiFor(`enum PetType {}`);

    expectDiagnostics(diagnostics, {
      code: "@typespec/openapi3/empty-enum",
      message: "Empty enums are not supported for OpenAPI v3 - enums must have at least one value.",
    });
  });

  it("supports summary on enums", async () => {
    const res = await oapiForModel(
      "Foo",
      `
      @summary("FooEnum")
      enum Foo {
        y: 0;
      };
      `,
    );
    strictEqual(res.schemas.Foo.title, "FooEnum");
  });
});

worksFor(["3.0.0"], ({ diagnoseOpenApiFor }) => {
  it("throws diagnostics for enum with different types", async () => {
    const diagnostics = await diagnoseOpenApiFor(`enum PetType {asString: "dog", asNumber: 1}`);

    expectDiagnostics(diagnostics, {
      code: "@typespec/openapi3/enum-unique-type",
      message: "Enums are not supported unless all options are literals of the same type.",
    });
  });
});

worksFor(["3.1.0"], ({ oapiForModel }) => {
  it("supports enum with different types", async () => {
    const res = await oapiForModel("PetType", `enum PetType {asString: "dog", asNumber: 1}`);

    deepStrictEqual(res.schemas.PetType, {
      type: ["string", "number"],
      enum: ["dog", 1],
    });
  });
});

worksFor(["3.1.0", "3.2.0"], ({ oapiForModel }) => {
  describe("enum-mode: annotated", () => {
    it("emits oneOf with const and per-member descriptions", async () => {
      const res = await oapiForModel(
        "PetType",
        `
        enum PetType {
          /** A four-legged friend */
          Dog: "dog",
          /** A whiskered companion */
          Cat: "cat",
        }
        `,
        { "enum-mode": "annotated" },
      );

      deepStrictEqual(res.schemas.PetType, {
        oneOf: [
          { type: "string", const: "dog", description: "A four-legged friend" },
          { type: "string", const: "cat", description: "A whiskered companion" },
        ],
      });
    });

    it("uses @summary as title on members", async () => {
      const res = await oapiForModel(
        "Priority",
        `
        enum Priority {
          @summary("Low priority")
          Low: 1,
          @summary("High priority")
          High: 10,
        }
        `,
        { "enum-mode": "annotated" },
      );

      deepStrictEqual(res.schemas.Priority, {
        oneOf: [
          { type: "number", const: 1, title: "Low priority" },
          { type: "number", const: 10, title: "High priority" },
        ],
      });
    });

    it("omits title/description when member has no annotations", async () => {
      const res = await oapiForModel(
        "PetType",
        `enum PetType { Dog: "dog", Cat: "cat" }`,
        { "enum-mode": "annotated" },
      );

      deepStrictEqual(res.schemas.PetType, {
        oneOf: [
          { type: "string", const: "dog" },
          { type: "string", const: "cat" },
        ],
      });
    });

    it("preserves enum-level description on wrapping schema", async () => {
      const res = await oapiForModel(
        "PetType",
        `
        /** Kinds of pets */
        enum PetType {
          /** A four-legged friend */
          Dog: "dog",
          Cat: "cat",
        }
        `,
        { "enum-mode": "annotated" },
      );

      deepStrictEqual(res.schemas.PetType, {
        description: "Kinds of pets",
        oneOf: [
          { type: "string", const: "dog", description: "A four-legged friend" },
          { type: "string", const: "cat" },
        ],
      });
    });
  });
});

worksFor(["3.0.0"], ({ oapiForModel }) => {
  it("ignores enum-mode: annotated and still emits flat enum", async () => {
    const res = await oapiForModel(
      "PetType",
      `
      enum PetType {
        /** A four-legged friend */
        Dog: "dog",
        Cat: "cat",
      }
      `,
      { "enum-mode": "annotated" },
    );

    deepStrictEqual(res.schemas.PetType, {
      type: "string",
      enum: ["dog", "cat"],
    });
  });
});
