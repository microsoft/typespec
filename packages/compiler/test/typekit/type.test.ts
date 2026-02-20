import { assert, describe, expect, it } from "vitest";
import { Enum, Model, Namespace, Scalar, Union } from "../../src/core/types.js";
import { isTemplateInstance } from "../../src/index.js";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../src/testing/expect.js";
import { $ } from "../../src/typekit/index.js";
import { getAssignables, getTypes } from "./utils.js";

describe("is", () => {
  it("checks if an entity is a type", async () => {
    const { sourceProp, program } = await getAssignables({ source: "string" });

    const tk = $(program);
    // 'true' cases where the entity is a type
    expect(tk.type.is(tk.builtin.string)).toBe(true);
    expect(tk.type.is(tk.literal.create("type"))).toBe(true);
    expect(tk.type.is(tk.intrinsic.any)).toBe(true);

    // 'false' cases where the entity is not a type
    expect(tk.type.is(sourceProp)).toBe(false);
    expect(tk.type.is(tk.value.create("value"))).toBe(false);
  });
});

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

  it("handles scalars correctly", async () => {
    const {
      Bar,
      context: { program },
    } = await getTypes(
      `
      scalar myInt extends int32;
      @test model Bar {
        myIntArray: Array<myInt>;
        myInt: myInt;
      }
      `,
      ["Bar"],
    );

    const myIntArray = (Bar as Model).properties.get("myIntArray")!.type as Model;
    expect(isTemplateInstance(myIntArray)).toBe(true);
    expect($(program).type.getPlausibleName(myIntArray)).toBe("MyIntArray");

    const myInt = (Bar as Model).properties.get("myInt")!.type as Scalar;
    expect(isTemplateInstance(myInt)).toBe(false);
    expect($(program).type.getPlausibleName(myInt)).toBe("myInt");
  });

  it("returns a generated name for various nesting levels", async () => {
    const {
      Bar,
      context: { program },
    } = await getTypes(
      `
      model Foo<T> {t: T};
      model Box<T> {t: T};
      @test model Bar {
        stringArrayArray: Array<Array<string>>;
        stringFoo: Foo<string>;
        boxFoo: Box<Foo<string>>;
      }
      `,
      ["Bar"],
    );

    const stringArrayArray = (Bar as Model).properties.get("stringArrayArray")!.type as Model;
    const stringFoo = (Bar as Model).properties.get("stringFoo")!.type as Model;
    const boxFoo = (Bar as Model).properties.get("boxFoo")!.type as Model;
    expect(isTemplateInstance(stringArrayArray)).toBe(true);
    expect($(program).type.getPlausibleName(stringArrayArray)).toBe("StringArrayArray");
    expect(isTemplateInstance(stringFoo)).toBe(true);
    expect($(program).type.getPlausibleName(stringFoo)).toBe("StringFoo");
    expect(isTemplateInstance(boxFoo)).toBe(true);
    expect($(program).type.getPlausibleName(boxFoo)).toBe("StringFooBox");
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

it("isError can check if a type is an error model", async () => {
  const {
    Foo,
    Error,
    context: { program },
  } = await getTypes(
    `
      @error
      model Error {
        props: string;
      }
      model Foo {}
      `,
    ["Foo", "Error"],
  );

  expect($(program).type.isError(Error)).toBe(true);
  expect($(program).type.isError(Foo)).toBe(false);
});

describe("inNamespace", () => {
  it("checks that a namespace belongs to itself", async () => {
    const {
      Root,
      context: { program },
    } = await getTypes(
      `
      namespace Root {}
      `,
      ["Root"],
    );
    expect($(program).type.inNamespace(Root, Root as Namespace)).toBe(true);
  });

  it("checks direct namespace membership", async () => {
    const {
      Root,
      context: { program },
    } = await getTypes(
      `
      namespace Root {
        namespace Child1 {
          namespace Child2 {}
        }
      }
      `,
      ["Root"],
    );

    const child1 = (Root as Namespace).namespaces.get("Child1");
    expect(child1).toBeDefined();
    const child2 = child1?.namespaces.get("Child2");
    expect(child2).toBeDefined();

    expect($(program).type.inNamespace(child1!, Root as Namespace)).toBe(true);
    expect($(program).type.inNamespace(child2!, Root as Namespace)).toBe(true);
  });

  it("checks model property namespace membership", async () => {
    const {
      Root,
      Outside,
      context: { program },
    } = await getTypes(
      `
      namespace Root {
        model Inside {
          prop: string;
        }
      }

      model Outside {
        prop: string;
      }
      `,
      ["Root", "Inside", "Outside"],
    );

    const model1 = (Root as Namespace).models.get("Inside");
    expect(model1).toBeDefined();
    const prop1 = model1?.properties.get("prop");
    expect(prop1).toBeDefined();

    const prop2 = (Outside as Model).properties.get("prop");
    expect(prop2).toBeDefined();

    expect($(program).type.inNamespace(prop1!, Root as Namespace)).toBe(true);
    expect($(program).type.inNamespace(prop2!, Root as Namespace)).toBe(false);
  });

  it("checks enum member namespace membership", async () => {
    const {
      Root,
      context: { program },
    } = await getTypes(
      `
      namespace Root {
        enum Test {
          A,
          B
        }
      }
      `,
      ["Root"],
    );

    const enum1 = (Root as Namespace).enums.get("Test");
    const enumMember = enum1?.members.get("A");
    expect(enumMember).toBeDefined();

    expect($(program).type.inNamespace(enumMember!, Root as Namespace)).toBe(true);
  });

  it("checks union variant namespace membership", async () => {
    const {
      Root,
      context: { program },
    } = await getTypes(
      `
      namespace Root {
        union Test {
          A: string,
          B: int32
        }
      }
      `,
      ["Root"],
    );

    const union = (Root as Namespace).unions.get("Test");
    const variant = union?.variants.get("A");
    expect(variant).toBeDefined();

    expect($(program).type.inNamespace(variant!, Root as Namespace)).toBe(true);
  });

  it("checks interface operation namespace membership", async () => {
    const {
      Root,
      context: { program },
    } = await getTypes(
      `
      namespace Root {
        interface Test {
          op myOp(): void;
        }
      }
      `,
      ["Root"],
    );

    const test = (Root as Namespace).interfaces.get("Test");
    const operation = test?.operations.get("myOp");
    expect(operation).toBeDefined();

    expect($(program).type.inNamespace(operation!, Root as Namespace)).toBe(true);
  });

  it("checks operations namespace membership", async () => {
    const {
      Root,
      context: { program },
    } = await getTypes(
      `
      namespace Root {
        op myOp(): void;
      }
      `,
      ["Root"],
    );
    const operation = (Root as Namespace).operations.get("myOp");
    expect(operation).toBeDefined();

    expect($(program).type.inNamespace(operation!, Root as Namespace)).toBe(true);
  });

  it("returns false for types outside the namespace", async () => {
    const {
      Root,
      Outside,
      context: { program },
    } = await getTypes(
      `
      namespace Root {
        namespace Child1 {}
      }
      namespace Outside {}
      `,
      ["Root", "Outside"],
    );
    const child1 = (Root as Namespace).namespaces.get("Child1");
    expect(child1).toBeDefined();

    expect($(program).type.inNamespace(child1!, Outside as Namespace)).toBe(false);
  });

  it("returns false for types without namespace", async () => {
    const {
      MyNamespace,
      context: { program },
    } = await getTypes(
      `
      namespace MyNamespace { }
      `,
      ["MyNamespace"],
    );

    const stringLiteral = $(program).literal.create("test");
    expect($(program).type.inNamespace(stringLiteral, MyNamespace as Namespace)).toBe(false);
  });
});

describe("isAssignableTo", () => {
  it("validates against Type", async () => {
    const { program } = await getAssignables({});

    const tk = $(program);
    const stringType = tk.builtin.string;
    expect(tk.type.isAssignableTo(tk.literal.create("foo"), stringType)).toBe(true);
    expect(tk.type.isAssignableTo(tk.literal.create(123), stringType)).toBe(false);
  });

  it("validates against Value", async () => {
    const { program } = await getAssignables({});

    const tk = $(program);
    // Can't actually assign a type to a value.
    expect(tk.type.isAssignableTo(tk.literal.create("foo"), tk.value.create("foo"))).toBe(false);
  });

  it("validates against MixedParameterConstraint", async () => {
    const { targetProp, program } = await getAssignables({ target: "string" });
    expect(targetProp.entityKind).toBe("MixedParameterConstraint");

    const tk = $(program);
    expect(tk.type.isAssignableTo(tk.literal.create("foo"), targetProp)).toBe(true);
    expect(tk.type.isAssignableTo(tk.literal.create(123), targetProp)).toBe(false);
  });

  it("validates against Indeterminate", async () => {
    const {
      program,
      types: { Instance },
    } = await getAssignables({
      code: `
        model Template<A extends string> { field: A }
        @test model Instance is Template<"foo">;
      `,
    });
    const indeterminate = (Instance as Model).sourceModels[0].model!.templateMapper!.args[0];
    expect(indeterminate.entityKind).toBe("Indeterminate");

    const tk = $(program);
    expect(tk.type.isAssignableTo(tk.literal.create("foo"), indeterminate)).toBe(true);
    expect(tk.type.isAssignableTo(tk.literal.create(123), indeterminate)).toBe(false);
  });

  it("withDiagnostics emits diagnostic when assigning incompatible types", async () => {
    const { program } = await getAssignables({});

    const tk = $(program);
    const invalidTest = tk.type.isAssignableTo.withDiagnostics(
      tk.literal.create("foo"),
      tk.builtin.boolean,
    );
    expect(invalidTest[0]).toBe(false);
    expectDiagnostics(invalidTest[1], { code: "unassignable" });

    const validTest = tk.type.isAssignableTo.withDiagnostics(
      tk.literal.create(true),
      tk.builtin.boolean,
    );
    expect(validTest[0]).toBe(true);
    expectDiagnosticEmpty(validTest[1]);
  });
});

describe("resolve", () => {
  it("resolves to the value type", async () => {
    const {
      context: { program },
    } = await getTypes(
      `
        alias stringLiteral = "hello";
        alias aliasedLiteral = stringLiteral;
        enum Foo { one: 1, two: 2 }
        const aValue = "value";
      `,
      [],
    );

    const tk = $(program);
    const stringLiteral = tk.type.resolve("stringLiteral");
    assert(tk.literal.isString(stringLiteral!));
    expect(stringLiteral.value).toBe("hello");

    const aliasedLiteral = tk.type.resolve("aliasedLiteral", "String");
    expect(aliasedLiteral!.value).toBe("hello");

    const enumMember = tk.type.resolve("Foo.one", "EnumMember");
    expect(tk.enumMember.is(enumMember!)).toBe(true);

    // Not actually a type
    const confusedValue = tk.type.resolve("aValue");
    expect(confusedValue).toBeUndefined();
  });

  it("throws an error for incorrect kind assertion", async () => {
    const {
      context: { program },
    } = await getTypes(
      `
        alias stringLiteral = "hello";
      `,
      [],
    );

    const tk = $(program);
    expect(() => tk.type.resolve("stringLiteral", "Boolean")).toThrow(
      "Type kind mismatch: expected Boolean, got String",
    );
  });

  it("returns undefined and diagnostics for invalid references", async () => {
    const {
      context: { program },
    } = await getTypes(``, []);

    const tk = $(program);
    const [unknownType, diagnostics] = tk.type.resolve.withDiagnostics("unknownType");
    expect(unknownType).toBeUndefined();
    expectDiagnostics(diagnostics, {
      code: "invalid-ref",
    });
  });
});

describe("inline named models", () => {
  it("getPlausibleName returns inline model name", async () => {
    const {
      Child,
      context: { program },
    } = await getTypes(
      `
      model Parent {
        child: model Child {
          name: string;
        };
      }
      `,
      ["Child"],
    );

    expect($(program).type.getPlausibleName(Child as Model)).toBe("Child");
  });

  it("clone works on inline named models", async () => {
    const {
      Child,
      context: { program },
    } = await getTypes(
      `
      model Parent {
        child: model Child {
          name: string;
        };
      }
      `,
      ["Child"],
    );

    const clone = $(program).type.clone(Child) as Model;
    expect(clone.name).toBe("Child");
    expect(clone.properties.has("name")).toBe(true);
  });

  it("isAssignableTo works with inline named models", async () => {
    const {
      Child,
      context: { program },
    } = await getTypes(
      `
      model Parent {
        child: model Child {
          name: string;
        };
      }
      `,
      ["Child"],
    );

    const tk = $(program);
    // An inline named model should be assignable to itself
    expect(tk.type.isAssignableTo(Child, Child)).toBe(true);
  });

  it("resolve finds inline named models by name", async () => {
    const {
      context: { program },
    } = await getTypes(
      `
      model Parent {
        child: model Child {
          name: string;
        };
      }
      `,
      [],
    );

    const tk = $(program);
    const resolved = tk.type.resolve("Child", "Model");
    expect(resolved).toBeDefined();
    expect(resolved!.name).toBe("Child");
  });
});
