import { expect, it } from "vitest";
import { expectDiagnostics, t } from "../../../src/testing/index.js";
import { Tester } from "../../tester.js";

it("assigns a value constructed through an alias to an instantiated scalar", async () => {
  await Tester.compile(`
    alias TT = Test<string>;
    const namespaceRef: TT = TT.from("a");
    scalar Test<T> { init from(a: string); }
  `);
});

it.each([false, true])(
  "constructs an aliased scalar instantiation (declaration first: %s)",
  async (declarationFirst) => {
    const declaration = "scalar Test<T> { init from(a: string); }";
    const { TT, namespaceRef } = await Tester.compile(t.code`
      ${declarationFirst ? declaration : ""}
      alias ${t.scalar("TT")} = Test<string>;
      const ${t.scalarValue("namespaceRef")}: TT = TT.from("a");
      ${declarationFirst ? "" : declaration}
    `);

    expect(namespaceRef.scalar).toBe(TT);
    expect(namespaceRef.type).toBe(TT);
    expect(TT.constructors.get("from")!.scalar).toBe(TT);
  },
);

it.each(["string", "int32"] as const)(
  "keeps constructor values tied to their instantiation when %s is used first",
  async (first) => {
    const second = first === "string" ? "int32" : "string";
    const { First, Second, a, b, again } = await Tester.compile(t.code`
      scalar Test<T> { init from(a: string); }
      alias ${t.scalar("First")} = Test<${first}>;
      const ${t.scalarValue("a")} = First.from("a");
      alias ${t.scalar("Second")} = Test<${second}>;
      const ${t.scalarValue("b")} = Second.from("b");
      const ${t.scalarValue("again")} = First.from("c");
    `);

    expect(First).not.toBe(Second);
    for (const value of [a, again]) {
      expect(value.scalar).toBe(First);
      expect(value.type).toBe(First);
    }
    expect(b.scalar).toBe(Second);
    expect(b.type).toBe(Second);
  },
);

it.each(["string", "int32"] as const)(
  "instantiates initializer parameters when %s is used first",
  async (first) => {
    const second = first === "string" ? "int32" : "string";
    const firstArg = first === "string" ? '"a"' : "123";
    const secondArg = second === "string" ? '"b"' : "456";
    const { First, Second, a, b, again, program } = await Tester.compile(t.code`
      scalar Test<T> { init from(a: T); }
      alias ${t.scalar("First")} = Test<${first}>;
      const ${t.scalarValue("a")}: First = First.from(${firstArg});
      alias ${t.scalar("Second")} = Test<${second}>;
      const ${t.scalarValue("b")}: Second = Second.from(${secondArg});
      const ${t.scalarValue("again")}: First = First.from(${firstArg});
    `);

    expect(First.constructors.get("from")!.parameters[0].type).toBe(
      program.checker.getStdType(first),
    );
    expect(Second.constructors.get("from")!.parameters[0].type).toBe(
      program.checker.getStdType(second),
    );
    expect(a.scalar).toBe(First);
    expect(a.type).toBe(First);
    expect(b.scalar).toBe(Second);
    expect(b.type).toBe(Second);
    expect(again.scalar).toBe(First);
    expect(again.type).toBe(First);
  },
);

it("constructs a scalar directly using its default template argument", async () => {
  const { Instance, value } = await Tester.compile(t.code`
    scalar Test<T = string> { init from(a: T); }
    alias ${t.scalar("Instance")} = Test<string>;
    const ${t.scalarValue("value")} = Test.from("a");
  `);

  expect(value.scalar).toBe(Instance);
  expect(value.type).toBe(Instance);
});

it("preserves the instantiation through scalar and constructor aliases", async () => {
  const { Instance, value } = await Tester.compile(t.code`
    scalar Test<T> { init from(a: T); }
    alias ${t.scalar("Instance")} = Test<string>;
    alias Indirect = Instance;
    alias From = Indirect.from;
    const ${t.scalarValue("value")} = From("a");
  `);

  expect(value.scalar).toBe(Instance);
  expect(value.type).toBe(Instance);
});

it.each([
  "scalar Derived<T> extends Base<T>; alias Instance = Derived<string>;",
  "scalar Derived extends Base<string>; alias Instance = Derived;",
])("constructs the derived scalar with an inherited initializer: %s", async (derived) => {
  const { Expected, value, program } = await Tester.compile(t.code`
    scalar Base<T> { init from(a: T); }
    ${derived}
    alias ${t.scalar("Expected")} = Instance;
    const ${t.scalarValue("value")}: Instance = Instance.from("a");
  `);

  expect(value.scalar).toBe(Expected);
  expect(value.type).toBe(Expected);
  expect(Expected.constructors.get("from")!.scalar).toBe(Expected);
  expect(Expected.constructors.get("from")!.parameters[0].type).toBe(
    program.checker.getStdType("string"),
  );
});

it.each([
  ["Test<string>", "123", "string"],
  ["Test<int32>", '"a"', "int32"],
  ["Derived<string>", "123", "string"],
])("rejects an invalid argument to %s", async (instance, argument, parameterType) => {
  const diagnostics = await Tester.diagnose(`
    scalar Test<T> { init from(a: T); }
    scalar Derived<T> extends Test<T>;
    alias Strings = Test<string>;
    alias Numbers = Test<int32>;
    alias Instance = ${instance};
    const value = Instance.from(${argument});
  `);

  expectDiagnostics(diagnostics, {
    code: "invalid-argument",
    message: `Argument of type '${argument}' is not assignable to parameter of type '${parameterType}'`,
  });
});

it.each(["Test", "Alias"])("preserves non-generic constructor identity through %s", async (ref) => {
  const { Test, value } = await Tester.compile(t.code`
    scalar ${t.scalar("Test")} { init from(a: string); }
    alias Alias = Test;
    const ${t.scalarValue("value")}: Test = ${ref}.from("a");
  `);

  expect(value.scalar).toBe(Test);
  expect(value.type).toBe(Test);
});
