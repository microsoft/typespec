import { describe, expect, it } from "vitest";
import { Enum, Model, Scalar, Union } from "../../../src/core/types.js";
import { $ } from "../../../src/experimental/typekit/index.js";
import { isTemplateInstance } from "../../../src/index.js";
import { getTypes } from "./utils.js";

it("should clone a model", async () => {
  const { Foo } = await getTypes(
    `
      model Foo {
        props: string;
      }
      `,
    ["Foo"],
  );

  const clone = $.type.clone(Foo) as Model;
  clone.properties.get("props")!.name = "props";
});

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
      ["Foo", "Bar", "Baz", "Qux"],
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
      ["Bar", "Test"],
    );

    const Foo = (Bar as Model).properties.get("foo")!.type as Model;
    const Foo2 = (Test as Model).properties.get("foo")!.type as Model;

    expect(isTemplateInstance(Foo)).toBe(true);
    expect($.type.getPlausibleName(Foo)).toBe("Baz_QuxFoo");
    expect(isTemplateInstance(Foo2)).toBe(true);
    expect($.type.getPlausibleName(Foo2)).toBe("Qux_BazFoo");
  });
});

describe("minValue and maxValue", () => {
  it("can get the min and max values from number", async () => {
    const { myNumber } = await getTypes(
      `
    @minValue(1)
    @maxValue(10)
    scalar myNumber extends numeric;
    `,
      ["myNumber"],
    );

    const max = $.type.maxValue(myNumber);
    const min = $.type.minValue(myNumber);

    expect(max).toBe(10);
    expect(min).toBe(1);
  });

  it("can get the min and max values from modelProperty", async () => {
    const { A } = await getTypes(
      `
    model A {
      @minValue(15)
      @maxValue(55)
      foo: int32;
    }
    `,
      ["A"],
    );

    const max = $.type.maxValue((A as Model).properties.get("foo")!);
    const min = $.type.minValue((A as Model).properties.get("foo")!);

    expect(max).toBe(55);
    expect(min).toBe(15);
  });
});

describe("minLength and maxLength", () => {
  it("can get the min and max length from string", async () => {
    const { myString } = await getTypes(
      `
    @minLength(1)
    @maxLength(10)
    scalar myString extends string;
    `,
      ["myString"],
    );

    const max = $.type.maxLength(myString);
    const min = $.type.minLength(myString);

    expect(max).toBe(10);
    expect(min).toBe(1);
  });

  it("can get the min and max length from modelProperty", async () => {
    const { A } = await getTypes(
      `
    model A {
      @minLength(15)
      @maxLength(55)
      foo: string;
    }
    `,
      ["A"],
    );

    const max = $.type.maxLength((A as Model).properties.get("foo")!);
    const min = $.type.minLength((A as Model).properties.get("foo")!);

    expect(max).toBe(55);
    expect(min).toBe(15);
  });
});

describe("minItems and maxItems", () => {
  it("can get the min and max items from array", async () => {
    const { myArray } = await getTypes(
      `
    @minItems(1)
    @maxItems(10)
    model myArray is Array<string>;
    `,
      ["myArray"],
    );

    const max = $.type.maxItems(myArray);
    const min = $.type.minItems(myArray);

    expect(max).toBe(10);
    expect(min).toBe(1);
  });

  it("can get the min and max items from modelProperty", async () => {
    const { A } = await getTypes(
      `
    model A {
      @minItems(15)
      @maxItems(55)
      foo: string[];
    }
    `,
      ["A"],
    );

    const max = $.type.maxItems((A as Model).properties.get("foo")!);
    const min = $.type.minItems((A as Model).properties.get("foo")!);

    expect(max).toBe(55);
    expect(min).toBe(15);
  });
});

describe("minValueExclusive and maxValueExclusive", () => {
  it("can get the min and max values from number", async () => {
    const { myNumber } = await getTypes(
      `
    @minValueExclusive(1)
    @maxValueExclusive(10)
    scalar myNumber extends numeric;
    `,
      ["myNumber"],
    );

    const max = $.type.maxValueExclusive(myNumber);
    const min = $.type.minValueExclusive(myNumber);

    expect(max).toBe(10);
    expect(min).toBe(1);
  });

  it("can get the min and max values from modelProperty", async () => {
    const { A } = await getTypes(
      `
    model A {
      @minValueExclusive(15)
      @maxValueExclusive(55)
      foo: int32;
    }
    `,
      ["A"],
    );

    const max = $.type.maxValueExclusive((A as Model).properties.get("foo")!);
    const min = $.type.minValueExclusive((A as Model).properties.get("foo")!);

    expect(max).toBe(55);
    expect(min).toBe(15);
  });
});
