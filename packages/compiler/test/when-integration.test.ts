import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { Model } from "../src/core/types.js";
import { createEmitterScope, getDecoratorsByScope } from "../src/core/when-scope.js";
import { Tester } from "./tester.js";

describe("compiler: when clause integration", () => {
  it("decorator with when clause carries condition through to type", async () => {
    const [{ program }, diagnostics] = await Tester.compileAndDiagnose(`
      @doc("always") 
      @doc("csharp-only") when emitter("@typespec/http-client-csharp")
      model Bar {}
    `);

    // Expect duplicate-decorator warnings (since we use @doc twice) — that's fine for POC
    const barType: Model = program.checker.getGlobalNamespaceType().models.get("Bar")!;
    ok(barType, "Bar model should exist");

    // The type should have 2 decorator applications
    strictEqual(barType.decorators.length, 2);

    // Decorators are stored closest-to-declaration first
    // @doc("csharp-only") when emitter("...") is closest, @doc("always") is outermost
    
    // First decorator (closest to model) has a when condition
    ok(barType.decorators[0].when);
    strictEqual(barType.decorators[0].when.length, 1);
    strictEqual(barType.decorators[0].when[0].kind, "emitter");
    strictEqual(barType.decorators[0].when[0].rawArgs![0], "@typespec/http-client-csharp");

    // Second decorator (outermost) is unconditional
    strictEqual(barType.decorators[1].when, undefined);

    // Query by scope
    const csharpScope = createEmitterScope({ emitter: "@typespec/http-client-csharp" });
    const pythonScope = createEmitterScope({ emitter: "@typespec/http-client-python" });

    const csharpDecs = getDecoratorsByScope(barType, csharpScope);
    strictEqual(csharpDecs.length, 2); // both: unconditional + csharp-scoped

    const pythonDecs = getDecoratorsByScope(barType, pythonScope);
    strictEqual(pythonDecs.length, 1); // only unconditional
  });

  it("emitter scope query works with multiple scoped decorators", async () => {
    const [{ program }] = await Tester.compileAndDiagnose(`
      @doc("CsFoo") when emitter("@typespec/http-client-csharp")
      @doc("PyFoo") when emitter("@typespec/http-client-python")
      @doc("Default")
      model Foo {}
    `);

    const fooType: Model = program.checker.getGlobalNamespaceType().models.get("Foo")!;
    ok(fooType, "Foo model should exist");

    strictEqual(fooType.decorators.length, 3);

    // C# emitter should see default + csharp-scoped
    const csharpDecs = getDecoratorsByScope(
      fooType,
      createEmitterScope({ emitter: "@typespec/http-client-csharp" }),
    );
    strictEqual(csharpDecs.length, 2);

    // Python emitter should see default + python-scoped
    const pyDecs = getDecoratorsByScope(
      fooType,
      createEmitterScope({ emitter: "@typespec/http-client-python" }),
    );
    strictEqual(pyDecs.length, 2);

    // Java emitter should see only default
    const javaDecs = getDecoratorsByScope(
      fooType,
      createEmitterScope({ emitter: "@typespec/http-client-java" }),
    );
    strictEqual(javaDecs.length, 1);
  });
});
