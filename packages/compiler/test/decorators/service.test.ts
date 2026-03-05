import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { getService, listServices } from "../../src/index.js";
import { expectDiagnostics, t } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("compiler: service", () => {
  it("allows no services", async () => {
    const { program } = await Tester.compile(t.code`
      op test(): string;
    `);

    deepStrictEqual(listServices(program), []);
  });

  it("allows a single service", async () => {
    const { S, program } = await Tester.compile(t.code`
      @service namespace ${t.namespace("S")} {}

    `);

    deepStrictEqual(listServices(program), [{ type: S }]);
  });

  it("get a service", async () => {
    const { S1, S2, program } = await Tester.compile(t.code`
    @service namespace ${t.namespace("S1")} {}

    @service namespace ${t.namespace("S2")} {}
  `);

    deepStrictEqual(getService(program, S1), { type: S1 });
    deepStrictEqual(getService(program, S2), { type: S2 });
  });

  it("allows multiple services", async () => {
    const { S1, S2, program } = await Tester.compile(t.code`
      @service namespace ${t.namespace("S1")} {}

      @service namespace ${t.namespace("S2")} {}
    `);

    deepStrictEqual(listServices(program), [{ type: S1 }, { type: S2 }]);
  });

  it("customize service title", async () => {
    const { S, program } = await Tester.compile(t.code`
      @service(#{title: "My Service"}) namespace ${t.namespace("S")} {}

    `);

    deepStrictEqual(listServices(program), [{ type: S, title: "My Service" }]);
  });

  it("emit diagnostic if service title is not a string", async () => {
    const diagnostics = await Tester.diagnose(`
      @service(#{title: 123}) namespace S {}
    `);

    expectDiagnostics(diagnostics, {
      code: "invalid-argument",
      message:
        "Argument of type '{ title: 123 }' is not assignable to parameter of type 'ServiceOptions'",
    });
  });

  it("emit diagnostic if service is used on a non namespace", async () => {
    const diagnostics = await Tester.diagnose(`
      @service model S {}
    `);

    expectDiagnostics(diagnostics, {
      code: "decorator-wrong-target",
      message: "Cannot apply @service decorator to S since it is not assignable to Namespace",
    });
  });
});
