import { expectDiagnostics } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { emitSchema, emitSchemaWithDiagnostics } from "./utils.js";

describe("json-schema: output file", () => {
  it("emit a file per declaration named after the declaration", async () => {
    const schemas = await emitSchema(`model Foo {}`);
    expect(Object.keys(schemas)).toContain("Foo.json");
  });

  it.each(["json", "yaml"] as const)(
    "configure %s filenames and update schema ids and references",
    async (fileType) => {
      const schemas = await emitSchema(
        `
          model Foo { bar: Bar; }
          model Bar {}
        `,
        { "file-type": fileType, "file-name": "{name}.schema.{ext}" },
      );

      expect(Object.keys(schemas).sort()).toEqual([
        `Bar.schema.${fileType}`,
        `Foo.schema.${fileType}`,
      ]);
      expect(schemas[`Foo.schema.${fileType}`].$id).toBe(`Foo.schema.${fileType}`);
      expect(schemas[`Foo.schema.${fileType}`].properties.bar.$ref).toBe(`Bar.schema.${fileType}`);
      expect(schemas[`Bar.schema.${fileType}`].$id).toBe(`Bar.schema.${fileType}`);
    },
  );

  it("use configured filenames with base URIs while preserving explicit ids", async () => {
    const schemas = await emitSchema(
      `
        @baseUri("https://example.org/")
        namespace Example {
          model Foo { bar: Bar; }
          @id("custom")
          model Bar {}
        }
      `,
      { "file-name": "{name}.schema.{ext}" },
    );

    expect(schemas["Foo.schema.json"].$id).toBe("https://example.org/Foo.schema.json");
    expect(schemas["Bar.schema.json"].$id).toBe("https://example.org/custom");
    expect(schemas["Foo.schema.json"].properties.bar.$ref).toBe("https://example.org/custom");
  });

  it("preserve the bundle filename while configuring bundled schema ids and references", async () => {
    const schemas = await emitSchema(
      `
        model Foo { bar: Bar; }
        model Bar {}
      `,
      { bundleId: "bundle.json", "file-name": "{name}.schema.{ext}" },
    );

    expect(Object.keys(schemas)).toEqual(["bundle.json"]);
    expect(schemas["bundle.json"].$id).toBe("bundle.json");
    expect(schemas["bundle.json"].$defs.Foo.$id).toBe("Foo.schema.json");
    expect(schemas["bundle.json"].$defs.Foo.properties.bar.$ref).toBe("Bar.schema.json");
    expect(schemas["bundle.json"].$defs.Bar.$id).toBe("Bar.schema.json");
  });

  it("sanitize declaration names in configured filenames", async () => {
    const schemas = await emitSchema("model `../../escaped` {}", {
      "file-name": "{name}.schema.{ext}",
    });
    expect(Object.keys(schemas)).toEqual([".._.._escaped.schema.json"]);
  });

  it.each(["schemas/{name}.schema.{ext}", "schemas\\{name}.schema.{ext}"])(
    "reject directory paths in the filename template %s",
    async (fileName) => {
      const [schemas, diagnostics] = await emitSchemaWithDiagnostics("model Foo {}", {
        "file-name": fileName,
      });

      expectDiagnostics(diagnostics, {
        code: "@typespec/json-schema/invalid-file-name",
        message:
          "The 'file-name' option must not contain directory separators. Use 'emitter-output-dir' to configure the output directory.",
      });
      expect(schemas).toEqual({});
    },
  );

  it("sanitize path separators and traversal in declaration names", async () => {
    const schemas = await emitSchema("model `../../escaped` {}");
    expect(Object.keys(schemas)).toContain(".._.._escaped.json");
  });

  it("sanitize declaration names only made of dots", async () => {
    const schemas = await emitSchema("model `..` {}");
    expect(Object.keys(schemas)).toContain("_.json");
  });

  it.each(["", ".", "..", "{unknown}", "{unknown}.", "{unknown}.."])(
    "reject filename templates resolving to an empty name or directory marker: %s",
    async (fileName) => {
      const [schemas, diagnostics] = await emitSchemaWithDiagnostics("model Foo {}", {
        "file-name": fileName,
      });

      expectDiagnostics(diagnostics, {
        code: "@typespec/json-schema/invalid-file-name",
        message:
          "The 'file-name' option must resolve to a non-empty file name other than '.' or '..'. Use '{name}' and '{ext}' as placeholders.",
      });
      expect(schemas).toEqual({});
    },
  );

  it("report filename collisions even when explicit schema ids are distinct", async () => {
    const [schemas, diagnostics] = await emitSchemaWithDiagnostics(
      `
        @id("foo") model Foo {}
        @id("bar") model Bar {}
        model Other {}
      `,
      { "file-name": "schema.{ext}" },
    );

    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/json-schema/duplicate-output-file",
        message:
          "Multiple schemas emit to the same file \"schema.json\". Configure 'file-name' to produce unique filenames.",
      },
      {
        code: "@typespec/json-schema/duplicate-output-file",
      },
      {
        code: "@typespec/json-schema/duplicate-output-file",
      },
    ]);
    expect(schemas).toEqual({});
  });

  it("report collisions introduced by sanitizing declaration names", async () => {
    const [schemas, diagnostics] = await emitSchemaWithDiagnostics(`
      @id("foo") model \`A/B\` {}
      @id("bar") model A_B {}
    `);

    expectDiagnostics(diagnostics, [
      { code: "@typespec/json-schema/duplicate-output-file" },
      { code: "@typespec/json-schema/duplicate-output-file" },
    ]);
    expect(schemas).toEqual({});
  });

  it("allow a fixed filename when only one schema is emitted", async () => {
    const schemas = await emitSchema(
      `
        @jsonSchema model Foo { bar: Bar; }
        model Bar {}
      `,
      { "file-name": "schema.{ext}" },
      { emitNamespace: false },
    );

    expect(Object.keys(schemas)).toEqual(["schema.json"]);
    expect(schemas["schema.json"].properties.bar.$ref).toBe("#/$defs/Bar");
  });

  it("allow matching schema filenames when bundling schemas with distinct ids", async () => {
    const schemas = await emitSchema(
      `
        @id("foo") model Foo {}
        @id("bar") model Bar {}
      `,
      { "file-name": "schema.{ext}", bundleId: "bundle.json" },
    );

    expect(Object.keys(schemas)).toEqual(["bundle.json"]);
    expect(Object.keys(schemas["bundle.json"].$defs).sort()).toEqual(["bar", "foo"]);
  });
});
