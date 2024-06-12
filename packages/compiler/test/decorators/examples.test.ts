import { ok } from "assert";
import { describe, expect, it } from "vitest";
import { getExamples, serializeValueAsJson } from "../../src/index.js";
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

describe("Provide example on", () => {
  it("model", async () => {
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
  it("model property", async () => {
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

  it("scalar", async () => {
    const { program, examples, target } = await getExamplesFor(`
      @example(test.fromISO("11:32"))
      @test scalar test extends utcDateTime;
    `);
    expect(examples).toHaveLength(1);
    expect(serializeValueAsJson(program, examples[0].value, target)).toEqual("11:32");
  });

  it("enum", async () => {
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

  it("union", async () => {
    const { program, examples, target } = await getExamplesFor(`
      @example(test.a)
      @test union test {a: "a", b: "b"}
    `);
    expect(examples).toHaveLength(1);
    expect(serializeValueAsJson(program, examples[0].value, target)).toEqual("a");
  });
});

describe("json serialization of examples", () => {
  async function getJsonValueOfExample(code: string) {
    const { examples, program, target } = await getExamplesFor(code);
    return serializeValueAsJson(program, examples[0].value, target);
  }

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
      }
    );
  });
});
