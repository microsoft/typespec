import { expect, it } from "vitest";
import { supportedVersions, worksFor } from "./works-for.js";

worksFor(supportedVersions, ({ oapiForModel, openApiFor }) => {
  it("inlines an anonymous enum used as a property type", async () => {
    const res = await oapiForModel("Foo", `model Foo { status: enum { active, inactive }; }`);
    const status = res.schemas.Foo.properties.status;
    expect(status.$ref).toBeUndefined();
    expect(status.enum).toEqual(["active", "inactive"]);
    expect(Object.keys(res.schemas)).toEqual(["Foo"]);
  });

  it("inlines an anonymous scalar used as a property type", async () => {
    const res = await oapiForModel("Foo", `model Foo { unit: scalar extends string; }`);
    const unit = res.schemas.Foo.properties.unit;
    expect(unit.$ref).toBeUndefined();
    expect(unit.type).toBe("string");
    // Regression: an anonymous scalar must not be emitted as an empty-named component.
    expect(Object.keys(res.schemas)).toEqual(["Foo"]);
  });

  it("inlines an anonymous union (keyword form) used as a property type", async () => {
    const res = await oapiForModel("Foo", `model Foo { value: union { string, int32 }; }`);
    const value = res.schemas.Foo.properties.value;
    expect(value.$ref).toBeUndefined();
    expect(Object.keys(res.schemas)).toEqual(["Foo"]);
  });

  it("hoists a named declaration expression as a component", async () => {
    const res = await oapiForModel("Foo", `model Foo { inner: model Inner { x: string }; }`);
    const inner = res.schemas.Foo.properties.inner;
    // A named declaration expression keeps its name and is hoisted/referenced.
    expect(inner.$ref).toBe("#/components/schemas/Inner");
    expect(res.schemas.Inner.type).toBe("object");
    expect(res.schemas.Inner.properties.x.type).toBe("string");
    expect(Object.keys(res.schemas).sort()).toEqual(["Foo", "Inner"]);
  });

  it("does not qualify declaration expressions with their enclosing namespace", async () => {
    const doc = await openApiFor(
      `
      @service namespace Demo {
        namespace Models {
          model Outer {
            inner: model Inner { value: string; };
            choice: enum Choice { active };
            code: scalar Code extends string;
          }
        }
        @get op read(): Models.Outer;
      }
    `,
      { "component-name-strategy": { kind: "fqn", separator: "_" } },
    );
    expect(Object.keys(doc.components.schemas)).toEqual([
      "Choice",
      "Code",
      "Inner",
      "Models_Outer",
    ]);
    expect(doc.components.schemas.Models_Outer.properties).toEqual({
      inner: { $ref: "#/components/schemas/Inner" },
      choice: { $ref: "#/components/schemas/Choice" },
      code: { $ref: "#/components/schemas/Code" },
    });
  });
});
