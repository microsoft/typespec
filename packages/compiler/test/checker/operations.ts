import { strictEqual } from "assert";
import { IntrinsicType, OperationType } from "../../core/types.js";
import { createTestHost, expectDiagnostics, TestHost } from "../../testing/index.js";

describe("cadl: operations", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("can return void", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test op foo(): void;
    `
    );

    const { foo } = (await testHost.compile("./main.cadl")) as { foo: OperationType };
    strictEqual(foo.returnType.kind, "Intrinsic");
    strictEqual((foo.returnType as IntrinsicType).name, "void");
  });

  it.only("can be templated", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `@test op foo<TString, TPayload>(name: TString, payload: TPayload): boolean;

      @test
      op newFoo: foo<string, string>;`
    );

    const [result, diagnostics] = await testHost.compileAndDiagnose("./main.cadl");
    expectDiagnostics(diagnostics, []);

    const { newFoo } = result as { newFoo: OperationType };
    strictEqual(newFoo.parameters.properties.size, 2);
    const props = Array.from(newFoo.parameters.properties.values());

    strictEqual(props[0].name, "name");
    strictEqual(props[1].name, "payload");
  });

  it.only("can reuse operation instances", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `@test op foo<TString, TPayload>(name: TString, payload: TPayload): boolean;

      op newFooBase<TPayload>: foo<string, TPayload>;
      op newFoo: newFooBase<string>;`
    );

    const [result, diagnostics] = await testHost.compileAndDiagnose("./main.cadl");
    expectDiagnostics(diagnostics, []);

    const { newFoo } = result as { newFoo: OperationType };
    strictEqual(newFoo.parameters.properties.size, 2);
    const props = Array.from(newFoo.parameters.properties.values());

    strictEqual(props[0].name, "name");
    strictEqual(props[1].name, "payload");
  });
});
