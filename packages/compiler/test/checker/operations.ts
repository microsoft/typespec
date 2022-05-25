import { ok, strictEqual } from "assert";
import { DecoratorContext, IntrinsicType, OperationType, Type } from "../../core/types.js";
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

  it("can be templated and referenced to define other operations", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `op foo<TName, TPayload>(name: TName, payload: TPayload): boolean;

      @test
      op newFoo: foo<string, string>;`
    );

    const [result, diagnostics] = await testHost.compileAndDiagnose("./main.cadl");
    expectDiagnostics(diagnostics, []);

    const { newFoo } = result as { newFoo: OperationType };
    strictEqual(newFoo.parameters.properties.size, 2);
    const props = Array.from(newFoo.parameters.properties.values());

    strictEqual(props[0].name, "name");
    strictEqual(props[0].type.kind, "Model");
    strictEqual(props[1].name, "payload");
    strictEqual(props[1].type.kind, "Model");
  });

  it("can be defined based on other operation references", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `op foo<TName, TPayload>(name: TName, payload: TPayload): boolean;
      op newFooBase<TPayload>: foo<string, TPayload>;

      @test
      op newFoo: newFooBase<string>;`
    );

    const [result, diagnostics] = await testHost.compileAndDiagnose("./main.cadl");
    expectDiagnostics(diagnostics, []);

    const { newFoo } = result as { newFoo: OperationType };
    strictEqual(newFoo.parameters.properties.size, 2);
    const props = Array.from(newFoo.parameters.properties.values());

    strictEqual(props[0].name, "name");
    strictEqual(props[0].type.kind, "Model");
    strictEqual(props[1].name, "payload");
    strictEqual(props[1].type.kind, "Model");
  });

  it("can reference an operation when being defined in an interface", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `op foo<TName, TPayload>(name: TName, payload: TPayload): boolean;

      interface Test {
        @test
        newFoo: foo<string, string>;
      }`
    );

    const [result, diagnostics] = await testHost.compileAndDiagnose("./main.cadl");
    expectDiagnostics(diagnostics, []);

    const { newFoo } = result as { newFoo: OperationType };
    strictEqual(newFoo.parameters.properties.size, 2);
    const props = Array.from(newFoo.parameters.properties.values());

    strictEqual(props[0].name, "name");
    strictEqual(props[0].type.kind, "Model");
    strictEqual(props[1].name, "payload");
    strictEqual(props[1].type.kind, "Model");
  });

  it("applies the decorators of the referenced operation and its transitive references", async () => {
    const alphaTargets = new Map<Type, Type>();
    const betaTargets = new Set<Type>();
    const kappaTargets = new Set<Type>();

    testHost.addJsFile("test.js", {
      $alpha(context: DecoratorContext, target: Type, param: Type) {
        alphaTargets.set(target, param);
      },

      $beta(context: DecoratorContext, target: Type) {
        betaTargets.add(target);
      },

      $kappa(context: DecoratorContext, target: Type) {
        kappaTargets.add(target);
      },
    });

    testHost.addCadlFile(
      "main.cadl",
      `
      import "./test.js";
      @alpha(TPayload)
      op foo<TName, TPayload>(name: TName, payload: TPayload): boolean;

      @beta
      op newFooBase<TPayload>: foo<string, TPayload>;

      @test
      @kappa
      op newFoo: newFooBase<string>;`
    );

    const [result, diagnostics] = await testHost.compileAndDiagnose("./main.cadl");
    expectDiagnostics(diagnostics, []);

    const { newFoo } = result as { newFoo: OperationType };
    strictEqual(newFoo.parameters.properties.size, 2);

    // Check that the decorators were applied correctly to `newFoo`
    strictEqual(alphaTargets.get(newFoo)?.kind, "Model");
    ok(betaTargets.has(newFoo));
    ok(kappaTargets.has(newFoo));
  });

  it("prevents the definition of a templated operation in an interface", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      interface Test {
        getResource<TResource>(name: string): TResource;
      }`
    );

    const [_, diagnostics] = await testHost.compileAndDiagnose("./main.cadl");
    expectDiagnostics(diagnostics, [
      {
        code: "token-expected",
        message: `':' expected.`,
      },
      {
        code: "token-expected",
        message: `';' expected.`,
      },
      {
        code: "unknown-identifier",
        message: `Unknown identifier TResource`,
      },
    ]);
  });
});
