import { describe, expect, it } from "vitest";
import { Enum, ErrorType, Model, Scalar, Union } from "../../../src/core/types.js";
import { $ } from "../../../src/experimental/typekit/index.js";
import { isTemplateInstance } from "../../../src/index.js";
import { createContextMock, getTypes } from "./utils.js";

it("should clone a model", async () => {
  const {
    Foo,
    context: { program },
  } = await getTypes(
    `
      model Foo {
        props: string;
      }
      `,
    ["Foo"],
  );

  const clone = $(program).type.clone(Foo) as Model;
  clone.properties.get("props")!.name = "props";
});

describe("getPlausibleName", () => {
  it("returns the original name if exists", async () => {
    const {
      Foo,
      Bar,
      Baz,
      Qux,
      context: { program },
    } = await getTypes(
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

    expect($(program).type.getPlausibleName(Foo as Model)).toBe("Foo");
    expect($(program).type.getPlausibleName(Bar as Union)).toBe("Bar");
    expect($(program).type.getPlausibleName(Baz as Enum)).toBe("Baz");
    expect($(program).type.getPlausibleName(Qux as Scalar)).toBe("Qux");
  });

  it("returns a generated name for anonymous model", async () => {
    const {
      Bar,
      Test,
      context: { program },
    } = await getTypes(
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
    expect($(program).type.getPlausibleName(Foo)).toBe("Baz_QuxFoo");
    expect(isTemplateInstance(Foo2)).toBe(true);
    expect($(program).type.getPlausibleName(Foo2)).toBe("Qux_BazFoo");
  });
});

describe("minValue and maxValue", () => {
  it("can get the min and max values from number", async () => {
    const {
      myNumber,
      context: { program },
    } = await getTypes(
      `
    @minValue(1)
    @maxValue(10)
    scalar myNumber extends numeric;
    `,
      ["myNumber"],
    );

    const max = $(program).type.maxValue(myNumber);
    const min = $(program).type.minValue(myNumber);

    expect(max).toBe(10);
    expect(min).toBe(1);
  });

  it("can get the min and max values from modelProperty", async () => {
    const {
      A,
      context: { program },
    } = await getTypes(
      `
    model A {
      @minValue(15)
      @maxValue(55)
      foo: int32;
    }
    `,
      ["A"],
    );

    const max = $(program).type.maxValue((A as Model).properties.get("foo")!);
    const min = $(program).type.minValue((A as Model).properties.get("foo")!);

    expect(max).toBe(55);
    expect(min).toBe(15);
  });
});

describe("minLength and maxLength", () => {
  it("can get the min and max length from string", async () => {
    const {
      myString,
      context: { program },
    } = await getTypes(
      `
    @minLength(1)
    @maxLength(10)
    scalar myString extends string;
    `,
      ["myString"],
    );

    const max = $(program).type.maxLength(myString);
    const min = $(program).type.minLength(myString);

    expect(max).toBe(10);
    expect(min).toBe(1);
  });

  it("can get the min and max length from modelProperty", async () => {
    const {
      A,
      context: { program },
    } = await getTypes(
      `
    model A {
      @minLength(15)
      @maxLength(55)
      foo: string;
    }
    `,
      ["A"],
    );

    const max = $(program).type.maxLength((A as Model).properties.get("foo")!);
    const min = $(program).type.minLength((A as Model).properties.get("foo")!);

    expect(max).toBe(55);
    expect(min).toBe(15);
  });
});

describe("minItems and maxItems", () => {
  it("can get the min and max items from array", async () => {
    const {
      myArray,
      context: { program },
    } = await getTypes(
      `
    @minItems(1)
    @maxItems(10)
    model myArray is Array<string>;
    `,
      ["myArray"],
    );

    const max = $(program).type.maxItems(myArray);
    const min = $(program).type.minItems(myArray);

    expect(max).toBe(10);
    expect(min).toBe(1);
  });

  it("can get the min and max items from modelProperty", async () => {
    const {
      A,
      context: { program },
    } = await getTypes(
      `
    model A {
      @minItems(15)
      @maxItems(55)
      foo: string[];
    }
    `,
      ["A"],
    );

    const max = $(program).type.maxItems((A as Model).properties.get("foo")!);
    const min = $(program).type.minItems((A as Model).properties.get("foo")!);

    expect(max).toBe(55);
    expect(min).toBe(15);
  });
});

describe("minValueExclusive and maxValueExclusive", () => {
  it("can get the min and max values from number", async () => {
    const {
      myNumber,
      context: { program },
    } = await getTypes(
      `
    @minValueExclusive(1)
    @maxValueExclusive(10)
    scalar myNumber extends numeric;
    `,
      ["myNumber"],
    );

    const max = $(program).type.maxValueExclusive(myNumber);
    const min = $(program).type.minValueExclusive(myNumber);

    expect(max).toBe(10);
    expect(min).toBe(1);
  });

  it("can get the min and max values from modelProperty", async () => {
    const {
      A,
      context: { program },
    } = await getTypes(
      `
    model A {
      @minValueExclusive(15)
      @maxValueExclusive(55)
      foo: int32;
    }
    `,
      ["A"],
    );

    const max = $(program).type.maxValueExclusive((A as Model).properties.get("foo")!);
    const min = $(program).type.minValueExclusive((A as Model).properties.get("foo")!);

    expect(max).toBe(55);
    expect(min).toBe(15);
  });
});

describe("isError", () => {
  it("is true for intristic errors", async () => {
    const error: ErrorType = {
      kind: "Intrinsic",
      name: "ErrorType",
      entityKind: "Type",
      isFinished: true,
    };

    const { program } = await createContextMock();

    expect($(program).type.isError(error)).toBe(true);
  });

  it("is true for @error models", async () => {
    const {
      Foo,
      context: { program },
    } = await getTypes(
      `
      @error
      model Foo {
        props: string;
      }
      `,
      ["Foo"],
    );

    expect($(program).type.isError(Foo)).toBe(true);
  });
});
