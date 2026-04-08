import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { expectDiagnostics } from "../../src/testing/expect.js";
import { mockFile, t } from "../../src/testing/index.js";
import { extractSquiggles } from "../../src/testing/source-utils.js";
import { Tester } from "../tester.js";

async function compileTypeOf(typeofCode: string, commonCode?: string) {
  const { target } = await Tester.compile(t.code`
    ${commonCode ?? ""}
    model Test {
      ${t.modelProperty("target")}: ${typeofCode};
    }
  `);
  ok(target, `Expected a property tagged with @test("target")`);
  strictEqual(target.kind, "ModelProperty");
  return target.type;
}

async function diagnoseTypeOf(typeofCode: string, commonCode?: string) {
  const diagnostics = await Tester.diagnose(`
    ${commonCode ?? ""}
    model Test {
      target: ${typeofCode};
    }
  `);
  return diagnostics;
}

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
    const { pos, end, source } = extractSquiggles(`
      model A<T ${constraint}> {
        prop: typeof ~~~T~~~;
      }
    `);
    const diagnostics = await Tester.diagnose(source);
    expectDiagnostics(diagnostics, {
      code: "expect-value",
      pos,
      end,
    });
  });
});

describe("typeof can be used to force sending a type to a decorator that accept both", () => {
  const tester = Tester.files({
    "dec.js": mockFile.js({
      $foo: (_ctx: any, _target: any, value: any) => {
        called = value;
      },
    }),
  }).import("./dec.js");

  let called: any;

  it("directly to decorator", async () => {
    called = undefined;
    await tester.compile(`
    extern dec foo(target, value: string | valueof string);

    @foo(typeof "abc")
    model A {}
  `);
    ok(called);
    strictEqual(called.kind, "String");
    strictEqual(called.value, "abc");
  });

  it("via template", async () => {
    called = undefined;
    await tester.compile(`
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
