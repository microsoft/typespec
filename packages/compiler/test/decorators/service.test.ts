import { deepStrictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { Namespace, getService, listServices } from "../../src/index.js";
import { BasicTestRunner, createTestRunner, expectDiagnostics } from "../../src/testing/index.js";

describe("compiler: service", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTestRunner();
  });

  it("allows no services", async () => {
    await runner.compile(`
      op test(): string;
    `);

    deepStrictEqual(listServices(runner.program), []);
  });

  it("allows a single service", async () => {
    const { S } = await runner.compile(`
      @test @service namespace S {}

    `);

    deepStrictEqual(listServices(runner.program), [{ type: S }]);
  });

  it("get a service", async () => {
    const { S1, S2 } = (await runner.compile(`
    @test @service namespace S1 {}

    @test @service namespace S2 {}
  `)) as { S1: Namespace; S2: Namespace };

    deepStrictEqual(getService(runner.program, S1), { type: S1 });
    deepStrictEqual(getService(runner.program, S2), { type: S2 });
  });

  it("allows multiple services", async () => {
    const { S1, S2 } = await runner.compile(`
      @test @service namespace S1 {}

      @test @service namespace S2 {}
    `);

    deepStrictEqual(listServices(runner.program), [{ type: S1 }, { type: S2 }]);
  });

  it("customize service title", async () => {
    const { S } = await runner.compile(`
      @test @service({title: "My Service"}) namespace S {}

    `);

    deepStrictEqual(listServices(runner.program), [{ type: S, title: "My Service" }]);
  });

  it("emit diagnostic if service title is not a string", async () => {
    const diagnostics = await runner.diagnose(`
      @test @service({title: 123}) namespace S {}
    `);

    expectDiagnostics(diagnostics, {
      code: "invalid-argument",
      message:
        "Argument of type '{ title: 123 }' is not assignable to parameter of type 'ServiceOptions'",
    });
  });

  it("customize service version", async () => {
    const { S } = await runner.compile(`
      @test @service({
        #suppress "deprecated" "test"
        version: "1.2.3"
      }) namespace S {}

    `);

    deepStrictEqual(listServices(runner.program), [{ type: S, version: "1.2.3" }]);
  });

  it("emit diagnostic if service is used on a non namespace", async () => {
    const diagnostics = await runner.diagnose(`
      @service model S {}
    `);

    expectDiagnostics(diagnostics, {
      code: "decorator-wrong-target",
      message: "Cannot apply @service decorator to S since it is not assignable to Namespace",
    });
  });

  it("emit diagnostic if service version is not a string", async () => {
    const diagnostics = await runner.diagnose(`
      @test @service({
        #suppress "deprecated" "test"
        version: 123
      }) namespace S {}
    `);

    expectDiagnostics(diagnostics, {
      code: "invalid-argument",
      message:
        "Argument of type '{ version: 123 }' is not assignable to parameter of type 'ServiceOptions'",
    });
  });
});
