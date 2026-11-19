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
});
