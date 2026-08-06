import { describe, expect, it } from "vitest";
import { emitSchema } from "./utils.js";

describe("declaration expressions", () => {
  it("inlines an anonymous enum used as a property type", async () => {
    const schemas = await emitSchema(`
      model Foo {
        status: enum { active, inactive };
      }
    `);

    // The anonymous enum must not be emitted as its own (empty-named) schema file.
    expect(Object.keys(schemas)).toEqual(["Foo.json"]);
    const status = schemas["Foo.json"].properties.status;
    expect(status.$ref).toBeUndefined();
    expect(status.enum).toEqual(["active", "inactive"]);
  });

  it("inlines an anonymous scalar used as a property type", async () => {
    const schemas = await emitSchema(`
      model Foo {
        unit: scalar extends string;
      }
    `);

    expect(Object.keys(schemas)).toEqual(["Foo.json"]);
    const unit = schemas["Foo.json"].properties.unit;
    expect(unit.$ref).toBeUndefined();
    expect(unit.type).toBe("string");
  });

  it("inlines an anonymous union (keyword form) used as a property type", async () => {
    const schemas = await emitSchema(`
      model Foo {
        value: union { string, int32 };
      }
    `);

    expect(Object.keys(schemas)).toEqual(["Foo.json"]);
    const value = schemas["Foo.json"].properties.value;
    expect(value.$ref).toBeUndefined();
  });

  it("hoists a named declaration expression into its own schema", async () => {
    const schemas = await emitSchema(`
      model Foo {
        inner: model Inner { x: string };
      }
    `);

    // A named declaration expression keeps its name and is hoisted/referenced.
    expect(Object.keys(schemas).sort()).toEqual(["Foo.json", "Inner.json"]);
    expect(schemas["Foo.json"].properties.inner).toEqual({ $ref: "Inner.json" });
    expect(schemas["Inner.json"].type).toBe("object");
    expect(schemas["Inner.json"].properties.x.type).toBe("string");
  });
});
