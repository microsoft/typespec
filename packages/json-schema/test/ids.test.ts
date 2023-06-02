import assert from "assert";
import { emitSchema } from "./utils.js";

describe("implicit ids", () => {
  it("when bundling, sets the id based on the declaration name", async () => {
    const schemas = await emitSchema(
      `
        model Foo {}
        `,
      { bundle: true }
    );

    assert.strictEqual(schemas["types.json"].$defs.Foo.$id, "Foo");
  });

  it("when not bundling, sets the id based on the declaration name and file path", async () => {
    const schemas = await emitSchema(`
        model Foo {}
      `);

    assert.strictEqual(schemas["Foo.json"].$id, "Foo.json");
  });

  it("with a base URI, sets the id based on the declaration name and file path", async () => {
    const schemas = await emitSchema(`
        @baseUri("http://example.org")
        namespace Test {
          model Foo {}
        }
      `);

    assert.strictEqual(schemas["Foo.json"].$id, "http://example.org/Foo.json");
  });

  it("throws errors on duplicate IDs", async () => {
    await assert.rejects(async () => {
      const schemas = await emitSchema(`
      namespace Test1 {
        model Foo {}
      }
      namespace Test2 {
        model Foo {}
      }
    `);
    });
  });
});

describe("explicit ids with $id", () => {
  it("sets the id explicitly without a baseURI", async () => {
    const schemas = await emitSchema(`
      @id("bar")
      model Foo {}
    `);

    assert.strictEqual(schemas["Foo.json"].$id, "bar");
  });

  it("sets the id relative to the base URI when present", async () => {
    const schemas = await emitSchema(`
      @baseUri("http://example.org")
      namespace Test {
        @id("bar")
        model Foo {}
      }
    `);

    assert.strictEqual(schemas["Foo.json"].$id, "http://example.org/bar");
  });

  it("sets the id relative to the base URI when present and when bundling", async () => {
    const schemas = await emitSchema(
      `
      @baseUri("http://example.org")
      namespace Test {
        @id("bar")
        model Foo {}
      }
      `,
      { bundle: true }
    );

    assert.strictEqual(schemas["types.json"].$defs.Foo.$id, "http://example.org/bar");
  });
});
