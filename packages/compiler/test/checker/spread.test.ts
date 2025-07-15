import { ok, strictEqual } from "assert";
import { describe, expect, it } from "vitest";
import { Type } from "../../src/core/types.js";
import { expectDiagnostics, extractSquiggles, mockFile, t } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

it("clones decorated properties", async () => {
  const blues = new WeakSet();
  function $blue(_: any, target: Type) {
    blues.add(target);
  }
  const { C } = await Tester.files({ "blue.js": mockFile.js({ $blue }) }).compile(t.code`
    import "./blue.js";
    model A { @blue foo: string }
    model B { @blue bar: string }
    @test model ${t.model("C")} { ... A, ... B }
  `);

  strictEqual(C.properties.size, 2);

  for (const [_, prop] of C.properties) {
    ok(blues.has(prop), prop.name + " is blue");
  }
});

it("doesn't emit additional diagnostic if spread reference is invalid-ref", async () => {
  const diagnostics = await Tester.diagnose(`
      model Foo {
        ...NotDefined
      }
      `);

  expectDiagnostics(diagnostics, {
    code: "invalid-ref",
    message: "Unknown identifier NotDefined",
  });
});

it("emit diagnostic if spreading non model type", async () => {
  const diagnostics = await Tester.diagnose(`
      alias U = (string | int32);
      model Foo {
        ...U
      }
      `);

  expectDiagnostics(diagnostics, {
    code: "spread-model",
    message: "Cannot spread properties of non-model type.",
  });
});

it("emit diagnostic if spreading scalar type", async () => {
  const diagnostics = await Tester.diagnose(`
      model Foo {
        ...string
      }
      `);

  expectDiagnostics(diagnostics, {
    code: "spread-model",
    message: "Cannot spread properties of non-model type.",
  });
});

it("emits duplicate diagnostic at correct location", async () => {
  const { source, pos, end } = extractSquiggles(`
      model Foo { 
        x: string 
      } 
      model Bar { 
        x: string, 
        ~~~...Foo~~~
      }
    `);

  const diagnostics = await Tester.diagnose(source);
  expectDiagnostics(diagnostics, {
    code: "duplicate-property",
    pos,
    end,
  });
});

describe("circular reference", () => {
  // https://github.com/microsoft/typespec/issues/2826
  describe("spread all properties", () => {
    it("before", async () => {
      const { B } = await Tester.compile(t.code`
      model ${t.model("B")} {  ...A }
      model A {
        b: B;
        prop: string;
      }
    
    `);
      expect(B.properties.has("b")).toBe(true);
      expect(B.properties.has("prop")).toBe(true);
    });

    it("after", async () => {
      const { B } = await Tester.compile(t.code`
      model A {
        b: B;
        prop: string;
      }
      model ${t.model("B")} {  ...A }
    `);
      expect(B.properties.has("b")).toBe(true);
      expect(B.properties.has("prop")).toBe(true);
    });
  });

  it("emit diagnostic if model spreads itself", async () => {
    const diagnostics = await Tester.diagnose(`
      model Foo {
        ...Foo,
        name: string,
      }
    `);

    expectDiagnostics(diagnostics, {
      code: "spread-model",
      message: "Cannot spread type within its own declaration.",
    });
  });

  it("emit diagnostic if model spreads itself through alias", async () => {
    const diagnostics = await Tester.diagnose(`
      model Foo {
        ...Bar,
        name: string,
      }
      alias Bar = Foo;
    `);

    expectDiagnostics(diagnostics, {
      code: "spread-model",
      message: "Cannot spread type within its own declaration.",
    });
  });

  it("emit diagnostic if models spread each other", async () => {
    const diagnostics = await Tester.diagnose(`
      model Foo { ...Bar }
      model Bar { ...Foo }
    `);

    expectDiagnostics(diagnostics, {
      code: "spread-model",
      message: "Cannot spread type within its own declaration.",
    });
  });
});
