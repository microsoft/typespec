import { expectDiagnostics, t } from "@typespec/compiler/testing";
import { expect, it } from "vitest";
import { getOperationId, setOperationId } from "../../src/decorators.js";
import { Tester } from "../test-host.js";

it("emit diagnostic if use on non operation", async () => {
  const diagnostics = await Tester.diagnose(`
    @operationId("foo")
    model Foo {}
  `);

  expectDiagnostics(diagnostics, {
    code: "decorator-wrong-target",
    message: "Cannot apply @operationId decorator to Foo since it is not assignable to Operation",
  });
});

it("emit diagnostic if operation id is not a string", async () => {
  const diagnostics = await Tester.diagnose(`
    @operationId(123)
    op foo(): string;
  `);

  expectDiagnostics(diagnostics, {
    code: "invalid-argument",
  });
});

it("set operation id via decorator", async () => {
  const { program, foo } = await Tester.compile(t.code`
    @operationId("myCustomId")
    op ${t.op("foo")}(): string;
  `);

  expect(getOperationId(program, foo)).toEqual("myCustomId");
});

it("getOperationId returns undefined when no operation id is set", async () => {
  const { program, foo } = await Tester.compile(t.code`
    op ${t.op("foo")}(): string;
  `);

  expect(getOperationId(program, foo)).toEqual(undefined);
});

it("setOperationId function sets operation id programmatically", async () => {
  const { program, foo } = await Tester.compile(t.code`
    op ${t.op("foo")}(): string;
  `);

  expect(getOperationId(program, foo)).toEqual(undefined);

  setOperationId(program, foo, "programmaticId");

  expect(getOperationId(program, foo)).toEqual("programmaticId");
});

it("setOperationId function can override decorator-set operation id", async () => {
  const { program, foo } = await Tester.compile(t.code`
    @operationId("decoratorId")
    op ${t.op("foo")}(): string;
  `);

  expect(getOperationId(program, foo)).toEqual("decoratorId");

  setOperationId(program, foo, "overrideId");

  expect(getOperationId(program, foo)).toEqual("overrideId");
});
