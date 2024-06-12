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
