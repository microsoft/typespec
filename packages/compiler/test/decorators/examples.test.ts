import { ok } from "assert";
import { describe, expect, it } from "vitest";
import { Operation, getExamples, getOpExamples, serializeValueAsJson } from "../../src/index.js";
import { expectDiagnostics } from "../../src/testing/expect.js";
import { createTestRunner } from "../../src/testing/test-host.js";

async function getExamplesFor(code: string) {
  const runner = await createTestRunner();
  const { test } = await runner.compile(code);

  ok(test, "Expect to have @test type named test.");
  return {
    program: runner.program,
    target: test,
    examples: getExamples(runner.program, test as any),
  };
}

async function getOpExamplesFor(code: string) {
  const runner = await createTestRunner();
  const { test } = (await runner.compile(code)) as { test: Operation };

  ok(test, "Expect to have @test type named test.");
  return {
    program: runner.program,
    target: test,
    examples: getOpExamples(runner.program, test as any),
  };
}

async function diagnoseCode(code: string) {
  const runner = await createTestRunner();
  return await runner.diagnose(code);
}

describe("@example", () => {
  describe("model", () => {
    it("valid", async () => {
      const { program, examples, target } = await getExamplesFor(`
      @example(#{ a: 1, b: 2 })
      @test model test {
        a: int32;
        b: int32;
      }
    `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual({ a: 1, b: 2 });
    });

    it("emit diagnostic for missing property", async () => {
      const diagnostics = await diagnoseCode(`
        @example(#{ a: 1 })
        @test model test {
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
        @test test: int32;
        b: int32;
      }
    `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual(1);
    });

    it("emit diagnostic for unassignable value", async () => {
      const diagnostics = await diagnoseCode(`
        model TestModel {
          @example("abc")
          @test test: int32;
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
      @test scalar test extends utcDateTime;
    `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual("11:32");
    });

    it("emit diagnostic for unassignable value", async () => {
      const diagnostics = await diagnoseCode(`
        @example("11:32")
        @test scalar test extends utcDateTime;
      `);
      expectDiagnostics(diagnostics, {
        code: "unassignable",
      });
    });
  });

  describe("enum", () => {
    it("valid", async () => {
      const { program, examples, target } = await getExamplesFor(`
      @example(test.a)
      @test enum test {
        a,
        b,
      }
    `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual("a");
    });

    it("emit diagnostic for unassignable value", async () => {
      const diagnostics = await diagnoseCode(`
        @example(1)
        @test enum test {
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
    it("valid", async () => {
      const { program, examples, target } = await getExamplesFor(`
      @example(test.a)
      @test union test {a: "a", b: "b"}
    `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual("a");
    });

    it("emit diagnostic for unassignable value", async () => {
      const diagnostics = await diagnoseCode(`
        @example(1)
        @test union test {a: "a", b: "b"}
      `);
      expectDiagnostics(diagnostics, {
        code: "unassignable",
      });
    });
  });

  it("emit diagnostic if used on Operation", async () => {
    const diagnostics = await diagnoseCode(`
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
      @test op test(...Pet): Pet;
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
      @test op test(...Pet): void;
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
      @test op test(): Pet;
    `);
    expect(examples).toHaveLength(1);
    ok(examples[0].parameters === undefined);
    ok(examples[0].returnType);
    expect(serializeValueAsJson(program, examples[0].returnType, target.returnType)).toEqual({
      id: "some",
      name: "Fluffy",
    });
  });

  it("emit diagnostic for unassignable value", async () => {
    const diagnostics = await diagnoseCode(`
          model Pet { id: string; name: string; }
          @opExample(
            #{
              returnType: #{ id: 123, name: "Fluffy" },
            }
          )
          @test op read(): Pet;
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
            @test test: ${type};
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
      @test("test") model B extends A {
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
      @test("test") model B {
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
      @test("test") model B {
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
      @test("test") model B {
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
      @test("test") model B {
        a: unknown
      }
    `);

    expect(result).toEqual({ a: { name: "one", other: 123 } });
  });

  it("serialize example targetting a union using one of the types", async () => {
    const result = await getJsonValueOfExample(`
      @example(#{ a: #{ name: "one", other: 123 } })
      @test("test") model Test {
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
