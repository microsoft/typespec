import { describe, expect, it } from "vitest";
import { Enum, Model, Scalar, Union } from "../../src/core/types.js";
import { isTemplateInstance } from "../../src/index.js";
import { $ } from "../../src/typekit/index.js";
import { getTypes } from "./utils.js";

describe("getPlausibleName", () => {
  it("returns the original name if exists", async () => {
    const { Foo, Bar, Baz, Qux } = await getTypes(
      `
      model Foo {
        props: string;
      }
  
      union Bar {
        "hi";
        "bye";
      }

      enum Baz {
        Baz: "baz";
      };

      scalar Qux extends string;
      `,
      ["Foo", "Bar", "Baz", "Qux"]
    );

    expect($.type.getPlausibleName(Foo as Model)).toBe("Foo");
    expect($.type.getPlausibleName(Bar as Union)).toBe("Bar");
    expect($.type.getPlausibleName(Baz as Enum)).toBe("Baz");
    expect($.type.getPlausibleName(Qux as Scalar)).toBe("Qux");
  });

  it("returns a generated name for anonymous model", async () => {
    const { Bar, Test } = await getTypes(
      `
     model Foo<T, K> {t: T, k: K};

      @test model Bar {
        foo: Foo<Baz, Qux> 
      }
      @test model Test {
        foo: Foo<Qux, Baz> 
      }
      model Baz {}
      model Qux {}
      `,
      ["Bar", "Test"]
    );

    const Foo = (Bar as Model).properties.get("foo")!.type as Model;
    const Foo2 = (Test as Model).properties.get("foo")!.type as Model;

    expect(isTemplateInstance(Foo)).toBe(true);
    expect($.type.getPlausibleName(Foo)).toBe("Baz_QuxFoo");
    expect(isTemplateInstance(Foo2)).toBe(true);
    expect($.type.getPlausibleName(Foo2)).toBe("Qux_BazFoo");
  });
});
