import { ok } from "assert";
import { describe, expect, it } from "vitest";
import { Operation, getExamples, getOpExamples, serializeValueAsJson } from "../../src/index.js";
import { expectDiagnostics } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

async function getExamplesFor(code: string) {
  const { test, program } = (await Tester.compile(code)) as any;

  ok(test, "Expect to have /*test*/ marker in code.");
  return {
    program,
    target: test,
    examples: getExamples(program, test as any),
  };
}

async function getOpExamplesFor(code: string) {
  const { test, program } = (await Tester.compile(code)) as any;

  ok(test, "Expect to have /*test*/ marker in code.");
  return {
    program,
    target: test as Operation,
    examples: getOpExamples(program, test as any),
  };
}

describe("@example", () => {
  describe("model", () => {
    it("valid", async () => {
      const { program, examples, target } = await getExamplesFor(`
      @example(#{ a: 1, b: 2 })
      model /*test*/test {
        a: int32;
        b: int32;
      }
    `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual({ a: 1, b: 2 });
    });

    it("use const with type of model", async () => {
      const { program, examples, target } = await getExamplesFor(`
      const example: test = #{ a: 1, b: 2 };
      @example(example)
      model /*test*/test {
        a: int32;
        b: int32;
      }
    `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual({ a: 1, b: 2 });
    });

    it("emit diagnostic for missing property", async () => {
      const diagnostics = await Tester.diagnose(`
        @example(#{ a: 1 })
        model test {
          a: int32;
          b: int32;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "missing-property",
      });
    });
  });

  describe("model property", () => {
    it("valid", async () => {
      const { program, examples, target } = await getExamplesFor(`
      model TestModel {
        @example(1)
        /*test*/test: int32;
        b: int32;
      }
    `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual(1);
    });

    it("emit diagnostic for unassignable value", async () => {
      const diagnostics = await Tester.diagnose(`
        model TestModel {
          @example("abc")
          test: int32;
          b: int32;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "unassignable",
      });
    });
  });

  describe("scalar", () => {
    it("valid", async () => {
      const { program, examples, target } = await getExamplesFor(`
      @example(test.fromISO("11:32"))
      scalar /*test*/test extends utcDateTime;
    `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual("11:32");
    });

    it("use const with type of scalar", async () => {
      const { program, examples, target } = await getExamplesFor(`
        const example: test = test.fromISO("11:32");
        @example(example)
        scalar /*test*/test extends utcDateTime;
      `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual("11:32");
    });

    it("emit diagnostic for unassignable value", async () => {
      const diagnostics = await Tester.diagnose(`
        @example("11:32")
        scalar test extends utcDateTime;
      `);
      expectDiagnostics(diagnostics, {
        code: "unassignable",
      });
    });

    it("returns undefined for custom scalar with no-argument initializer", async () => {
      const { program, examples, target } = await getExamplesFor(`
        @example(test.i())
        scalar /*test*/test {
          init i();
        }
      `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toBeUndefined();
    });

    it("returns undefined for custom scalar with string-argument initializer", async () => {
      const { program, examples, target } = await getExamplesFor(`
        @example(test.name("Shorty"))
        scalar /*test*/test {
          init name(value: string);
        }
      `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toBeUndefined();
    });
  });

  describe("enum", () => {
    it("valid", async () => {
      const { program, examples, target } = await getExamplesFor(`
      @example(test.a)
      enum /*test*/test {
        a,
        b,
      }
    `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual("a");
    });

    it("use const with type of enum", async () => {
      const { program, examples, target } = await getExamplesFor(`
      const example: test = test.a;
      @example(example)
      enum /*test*/test {
        a,
        b,
      }
    `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual("a");
    });

    it("emit diagnostic for unassignable value", async () => {
      const diagnostics = await Tester.diagnose(`
        @example(1)
        enum test {
          a,
          b,
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "unassignable",
      });
    });
  });

  describe("union", () => {
    it("valid for union member reference", async () => {
      const { program, examples, target } = await getExamplesFor(`
      @example(test.a)
      union /*test*/test {a: "a", b: "b"}
    `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual("a");
    });

    it("valid for object value", async () => {
      const { program, examples, target } = await getExamplesFor(`
        model A {
          type: "a";
          a: string;
        }
        model B {
          type: "b";
          b: numeric;
        }

        @example(#{
          type: "a",
          a: "a string",
        })
        union /*test*/test {a: A, b: B}
      `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual({
        type: "a",
        a: "a string",
      });
    });

    it("emit diagnostic for unassignable value", async () => {
      const diagnostics = await Tester.diagnose(`
        @example(1)
        union test {a: "a", b: "b"}
      `);
      expectDiagnostics(diagnostics, {
        code: "unassignable",
      });
    });
  });

  it("emit diagnostic if used on Operation", async () => {
    const diagnostics = await Tester.diagnose(`
      @example(1)
      op test(): void;
    `);
    expectDiagnostics(diagnostics, {
      code: "decorator-wrong-target",
    });
  });
});

describe("@opExample", () => {
  it("provide parameters and return type", async () => {
    const { program, examples, target } = await getOpExamplesFor(`
      model Pet { id: string; name: string; }

      @opExample(
        #{
          parameters: #{ id: "some", name: "Fluffy" },
          returnType: #{ id: "some", name: "Fluffy" },
        }
      )
      op /*test*/test(...Pet): Pet;
    `);
    expect(examples).toHaveLength(1);
    ok(examples[0].parameters);
    ok(examples[0].returnType);
    expect(serializeValueAsJson(program, examples[0].parameters, target.parameters)).toEqual({
      id: "some",
      name: "Fluffy",
    });
    expect(serializeValueAsJson(program, examples[0].returnType, target.returnType)).toEqual({
      id: "some",
      name: "Fluffy",
    });
  });

  it("provide only parameters", async () => {
    const { program, examples, target } = await getOpExamplesFor(`
      model Pet { id: string; name: string; }

      @opExample(
        #{
          parameters: #{ id: "some", name: "Fluffy" },
        }
      )
      op /*test*/test(...Pet): void;
    `);
    expect(examples).toHaveLength(1);
    ok(examples[0].parameters);
    ok(examples[0].returnType === undefined);
    expect(serializeValueAsJson(program, examples[0].parameters, target.parameters)).toEqual({
      id: "some",
      name: "Fluffy",
    });
  });
  it("provide only return type", async () => {
    const { program, examples, target } = await getOpExamplesFor(`
      model Pet { id: string; name: string; }

      @opExample(
        #{
          returnType: #{ id: "some", name: "Fluffy" },
        }
      )
      op /*test*/test(): Pet;
    `);
    expect(examples).toHaveLength(1);
    ok(examples[0].parameters === undefined);
    ok(examples[0].returnType);
    expect(serializeValueAsJson(program, examples[0].returnType, target.returnType)).toEqual({
      id: "some",
      name: "Fluffy",
    });
  });
  it("provide return type for union of unions", async () => {
    const { program, examples, target } = await getOpExamplesFor(`
      model Foo {
        type: "FOO";
      }

      model Bar {
        type: "BAR";
      }

      model One {
        type: "ONE";
      }

      model Two {
        type: "TWO";
      }

      @discriminated(#{ discriminatorPropertyName: "type", envelope: "none" })
      union FooOrBar {
        FOO: Foo,
        BAR: Bar,
      }

      @discriminated(#{ discriminatorPropertyName: "type", envelope: "none" })
      union OneOrTwo {
        ONE: One,
        TWO: Two
      }

      @opExample(#{ returnType: #{ type: "FOO" } })
      @opExample(#{ returnType: #{ type: "BAR" } })
      @opExample(#{ returnType: #{ type: "ONE" } })
      @opExample(#{ returnType: #{ type: "TWO" } })
      op /*test*/test(): FooOrBar | OneOrTwo;
    `);

    expect(examples).toHaveLength(4);
    ok(examples[0].returnType);
    expect(serializeValueAsJson(program, examples[0].returnType, target.returnType)).toEqual({
      type: "TWO",
    });
    ok(examples[1].returnType);
    expect(serializeValueAsJson(program, examples[1].returnType, target.returnType)).toEqual({
      type: "ONE",
    });
    ok(examples[2].returnType);
    expect(serializeValueAsJson(program, examples[2].returnType, target.returnType)).toEqual({
      type: "BAR",
    });
    ok(examples[3].returnType);
    expect(serializeValueAsJson(program, examples[3].returnType, target.returnType)).toEqual({
      type: "FOO",
    });
  });

  it("emit diagnostic for unassignable value", async () => {
    const diagnostics = await Tester.diagnose(`
          model Pet { id: string; name: string; }
          @opExample(
            #{
              returnType: #{ id: 123, name: "Fluffy" },
            }
          )
          op read(): Pet;
      `);
    expectDiagnostics(diagnostics, {
      code: "unassignable",
    });
  });
});

describe("json serialization of examples", () => {
  async function getJsonValueOfExample(code: string) {
    const { examples, program, target } = await getExamplesFor(code);
    return serializeValueAsJson(program, examples[0].value, target);
  }

  it("respect json encodedName", async () => {
    const result = await getJsonValueOfExample(`
      @example(#{
        expireIn: 1
      })
      model /*test*/test {
        @encodedName("application/json", "exp")
        expireIn: int32
      }
    `);

    expect(result).toEqual({ exp: 1 });
  });

  describe("scalar encoding", () => {
    const allCases: [
      string,
      {
        value: string;
        expect: unknown;
        encode?: string;
      }[],
    ][] = [
      ["int32", [{ value: `123`, expect: 123 }]],
      ["string", [{ value: `"abc"`, expect: "abc" }]],
      ["boolean", [{ value: `true`, expect: true }]],
      [
        "utcDateTime",
        [
          { value: `utcDateTime.fromISO("2024-01-01T11:32:00Z")`, expect: "2024-01-01T11:32:00Z" },
          {
            value: `utcDateTime.fromISO("2024-01-01T11:32:00Z")`,
            expect: "Mon, 01 Jan 2024 11:32:00 GMT",
            encode: `@encode("rfc7231")`,
          },
          {
            value: `utcDateTime.fromISO("2024-01-01T11:32:00Z")`,
            expect: 1704108720,
            encode: `@encode("unixTimestamp", int32)`,
          },
        ],
      ],
      [
        "offsetDateTime",
        [
          {
            value: `offsetDateTime.fromISO("2024-01-01T11:32:00+01:00")`,
            expect: "2024-01-01T11:32:00+01:00",
          },
          {
            value: `offsetDateTime.fromISO("2024-01-01T11:32:00+01:00")`,
            expect: "Mon, 01 Jan 2024 10:32:00 GMT",
            encode: `@encode("rfc7231")`,
          },
        ],
      ],
      [
        "plainDate",
        [
          {
            value: `plainDate.fromISO("2024-01-01")`,
            expect: "2024-01-01",
          },
        ],
      ],
      [
        "plainTime",
        [
          {
            value: `plainTime.fromISO("11:31")`,
            expect: "11:31",
          },
        ],
      ],
      [
        "duration",
        [
          {
            value: `duration.fromISO("PT5M")`,
            expect: "PT5M",
          },
          {
            value: `duration.fromISO("PT5M")`,
            expect: 300,
            encode: `@encode("seconds", int32)`,
          },
          {
            value: `duration.fromISO("PT0.5S")`,
            expect: 0.5,
            encode: `@encode("seconds", float32)`,
          },
        ],
      ],
    ];

    describe.each(allCases)("%s", (type, cases) => {
      const casesWithLabel = cases.map((x) => ({
        ...x,
        encodeLabel: x.encode ?? "default encoding",
      }));
      it.each(casesWithLabel)(
        `serialize with $encodeLabel`,
        async ({ value, expect: expected, encode }) => {
          const result = await getJsonValueOfExample(`
          model TestModel {
            @example(${value})
            ${encode ?? ""}
            /*test*/test: ${type};
          }
        `);
          if (expected instanceof RegExp) {
            expect(result).toMatch(expected);
          } else {
            expect(result).toEqual(expected);
          }
        },
      );
    });
  });

  it("serialize models with parent", async () => {
    const result = await getJsonValueOfExample(`
      @example(#{ a: "one", b: "two" })
      model /*test*/test extends A {
        b: string;
      }

      model A {
        a: string;
      }

    `);

    expect(result).toEqual({ a: "one", b: "two" });
  });

  it("serialize nested models", async () => {
    const result = await getJsonValueOfExample(`
      @example(#{ a: #{ name: "one" } })
      model /*test*/test {
        a: A;
      }

      model A {
        name: string;
      }

    `);

    expect(result).toEqual({ a: { name: "one" } });
  });

  it("serialize nested models in arrays", async () => {
    const result = await getJsonValueOfExample(`
      @example(#{ items: #[#{ name: "one" }, #{ name: "two" }] })
      model /*test*/test {
        items: Array<A>;
      }

      model A {
        name: string;
      }

    `);

    expect(result).toEqual({ items: [{ name: "one" }, { name: "two" }] });
  });

  it("serialize nested record in arrays", async () => {
    const result = await getJsonValueOfExample(`
      @example(#{ items: #{one: #{ name: "one" }, two: #{ name: "two" }} })
      model /*test*/test {
        items: Record<A>;
      }

      model A {
        name: string;
      }

    `);

    expect(result).toEqual({ items: { one: { name: "one" }, two: { name: "two" } } });
  });

  it("serialize example as it is when type is unknown", async () => {
    const result = await getJsonValueOfExample(`
      @example(#{ a: #{ name: "one", other: 123 } })
      model /*test*/test {
        a: unknown
      }
    `);

    expect(result).toEqual({ a: { name: "one", other: 123 } });
  });

  it("serialize example targetting a union using one of the types", async () => {
    const result = await getJsonValueOfExample(`
      @example(#{ a: #{ name: "one", other: 123 } })
      model /*test*/test {
        a: A | B;
      }

      model A {
        a: string
      }

      model B {
        name: string;
        other: int32;
      }
    `);

    expect(result).toEqual({ a: { name: "one", other: 123 } });
  });
});
