import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { expectDiagnostics } from "../../src/testing/expect.js";
import { createTestHost, createTestRunner } from "../../src/testing/test-host.js";
import { extractSquiggles } from "../../src/testing/test-server-host.js";
import { BasicTestRunner } from "../../src/testing/types.js";
import { defineTest } from "../test-utils.js";

const { compile: compileTypeOf, diagnose: diagnoseTypeOf } = defineTest(
  async (typeofCode: string, commonCode?: string) => {
    const runner = await createTestRunner();

    const [{ target }, diagnostics] = await runner.compileAndDiagnose(`
      ${commonCode ?? ""}
      model Test {
        @test target: ${typeofCode};
      }
    `);
    ok(target, `Expected a property tagged with @test("target")`);
    strictEqual(target.kind, "ModelProperty");
    return [target.type, diagnostics];
  },
);

describe("get the type of a const", () => {
  it("const without an explicit type return the precise type of the value", async () => {
    const type = await compileTypeOf(`typeof a`, `const a = 123;`);
    strictEqual(type.kind, "Number");
    strictEqual(type.value, 123);
  });

  it("const with an explicit type return const type", async () => {
    const type = await compileTypeOf(`typeof a`, `const a: int32 = 123;`);
    strictEqual(type.kind, "Scalar");
    strictEqual(type.name, "int32");
  });
});

describe("emit errors when typeof a type", () => {
  it("typeof scalar", async () => {
    const diagnostics = await diagnoseTypeOf(`typeof int32`);
    expectDiagnostics(diagnostics, {
      code: "expect-value",
      message: "int32 refers to a type, but is being used as a value here.",
    });
  });
  it("typeof model", async () => {
    const diagnostics = await diagnoseTypeOf(`typeof A`, "model A {}");
    expectDiagnostics(diagnostics, {
      code: "expect-value",
      message: "A refers to a type, but is being used as a value here.",
    });
  });
});

describe("emit error if trying to typeof a template parameter that accept types", () => {
  it.each([
    ["no constraint is equivalent `extends unknown`", ""],
    ["constrained to only types", "extends string"],
    ["constrained with types and value", "extends string | valueof string"],
  ])("%s", async (label, constraint) => {
    const runner = await createTestRunner();
    const { pos, end, source } = extractSquiggles(`
      model A<T ${constraint}> {
        prop: typeof ~~~T~~~;
      }
    `);
    const diagnostics = await runner.diagnose(source);
    expectDiagnostics(diagnostics, {
      code: "expect-value",
      pos,
      end,
    });
  });
});

describe("typeof can be used to force sending a type to a decorator that accept both", () => {
  let runner: BasicTestRunner;
  let called: any;

  beforeEach(async () => {
    called = undefined;
    const host = await createTestHost();
    host.addJsFile("dec.js", {
      $foo: (_ctx: any, _target: any, value: any) => {
        called = value;
      },
    });
    runner = await createTestRunner(host);
  });

  it("directly to decorator", async () => {
    await runner.compile(`
    import "./dec.js";
    extern dec foo(target, value: string | valueof string);

    @foo(typeof "abc")
    model A {}
  `);
    ok(called);
    strictEqual(called.kind, "String");
    strictEqual(called.value, "abc");
  });

  it("via template", async () => {
    await runner.compile(`
    import "./dec.js";
    extern dec foo(target, value: string | valueof string);

    alias T = A<typeof "abc">;
    @foo(T)
    model A<T extends string | valueof string> {}
  `);
    ok(called);
    strictEqual(called.kind, "String");
    strictEqual(called.value, "abc");
  });
});
