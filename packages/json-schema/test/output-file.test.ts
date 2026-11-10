import { describe, expect, it } from "vitest";
import { emitSchema } from "./utils.js";

describe("json-schema: output file", () => {
  it("emit a file per declaration named after the declaration", async () => {
    const schemas = await emitSchema(`model Foo {}`);
    expect(Object.keys(schemas)).toContain("Foo.json");
  });

  it("sanitize path separators and traversal in declaration names", async () => {
    const schemas = await emitSchema("model `../../escaped` {}");
    expect(Object.keys(schemas)).toContain(".._.._escaped.json");
  });

  it("sanitize declaration names only made of dots", async () => {
    const schemas = await emitSchema("model `..` {}");
    expect(Object.keys(schemas)).toContain("_.json");
  });
});
