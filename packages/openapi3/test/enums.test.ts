import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, strictEqual } from "assert";
import { it } from "vitest";
import { diagnoseOpenApiFor } from "./test-host.js";
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
  it("emits annotated enums with `enum-style: annotated`", async () => {
    const res = await oapiForModel(
      "PetType",
      `
      @doc("Type of pet.")
      enum PetType {
        /** A loyal canine companion. */
        @summary("Dog")
        Dog: "dog",

        /** A self-sufficient feline. */
        @summary("Cat")
        Cat: "cat",
      }
      `,
      { "enum-style": "annotated" },
    );

    deepStrictEqual(res.schemas.PetType, {
      description: "Type of pet.",
      oneOf: [
        {
          const: "dog",
          title: "Dog",
          description: "A loyal canine companion.",
        },
        {
          const: "cat",
          title: "Cat",
          description: "A self-sufficient feline.",
        },
      ],
    });
  });

  it("emits annotated enums for number-valued enums", async () => {
    const res = await oapiForModel(
      "Priority",
      `
      enum Priority {
        /** Low priority. */
        Low: 1,
        /** High priority. */
        High: 10,
      }
      `,
      { "enum-style": "annotated" },
    );

    deepStrictEqual(res.schemas.Priority, {
      oneOf: [
        { const: 1, description: "Low priority." },
        { const: 10, description: "High priority." },
      ],
    });
  });

  it("emits annotated enums for mixed-type enums", async () => {
    const res = await oapiForModel(
      "Mixed",
      `
      enum Mixed {
        asString: "value",
        asNumber: 42,
      }
      `,
      { "enum-style": "annotated" },
    );

    deepStrictEqual(res.schemas.Mixed, {
      oneOf: [{ const: "value" }, { const: 42 }],
    });
  });

  it("emits annotated enums omitting title/description for members without docs", async () => {
    const res = await oapiForModel(
      "Color",
      `
      enum Color {
        Red,
        Green: "green",
        /** Blue is the warmest color. */
        Blue: "blue",
      }
      `,
      { "enum-style": "annotated" },
    );

    deepStrictEqual(res.schemas.Color, {
      oneOf: [
        { const: "Red" },
        { const: "green" },
        { const: "blue", description: "Blue is the warmest color." },
      ],
    });
  });

  it("emits default enum form when `enum-style` is unset", async () => {
    const res = await oapiForModel(
      "PetType",
      `
      /** Type of pet. */
      enum PetType {
        /** A loyal canine companion. */
        @summary("Dog")
        Dog: "dog",
      }
      `,
    );

    deepStrictEqual(res.schemas.PetType, {
      type: "string",
      enum: ["dog"],
      description: "Type of pet.",
    });
  });
});

worksFor(["3.0.0"], ({ emitOpenApiWithDiagnostics }) => {
  it("falls back to the default enum form when `enum-style: annotated` is set", async () => {
    const [doc, diagnostics] = await emitOpenApiWithDiagnostics(
      `
      @service
      namespace Test;

      /** Type of pet. */
      enum PetType {
        /** A loyal canine companion. */
        Dog: "dog",
        /** A self-sufficient feline. */
        Cat: "cat",
      }
      op read(): PetType;
      `,
      { "enum-style": "annotated" },
    );

    expectDiagnostics(diagnostics, {
      code: "@typespec/openapi3/enum-style-not-supported",
      severity: "warning",
    });

    deepStrictEqual(doc.components!.schemas!.PetType, {
      type: "string",
      enum: ["dog", "cat"],
      description: "Type of pet.",
    });
  });
});

it("warns when `enum-style: annotated` is used with OpenAPI 3.0.0", async () => {
  const diagnostics = await diagnoseOpenApiFor(`enum PetType { Dog: "dog" }`, {
    "enum-style": "annotated",
    "openapi-versions": ["3.0.0"],
  });

  expectDiagnostics(diagnostics, {
    code: "@typespec/openapi3/enum-style-not-supported",
    severity: "warning",
  });
});

it("warns once when `enum-style: annotated` is used with mixed openapi-versions including 3.0.0", async () => {
  const diagnostics = await diagnoseOpenApiFor(`enum PetType { Dog: "dog" }`, {
    "enum-style": "annotated",
    "openapi-versions": ["3.0.0", "3.1.0"],
  });

  expectDiagnostics(diagnostics, {
    code: "@typespec/openapi3/enum-style-not-supported",
    severity: "warning",
  });
});

it("does not warn when `enum-style: annotated` is used with only 3.1.0/3.2.0", async () => {
  const diagnostics = await diagnoseOpenApiFor(`enum PetType { Dog: "dog" }`, {
    "enum-style": "annotated",
    "openapi-versions": ["3.1.0", "3.2.0"],
  });

  strictEqual(
    diagnostics.filter((d) => d.code === "@typespec/openapi3/enum-style-not-supported").length,
    0,
  );
});
