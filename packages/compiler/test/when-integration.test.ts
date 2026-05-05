import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { Model } from "../src/core/types.js";
import {
  applyScopedDecorators,
  createEmitterScope,
  getDecoratorsByScope,
} from "../src/core/when-scope.js";
import { getDoc } from "../src/lib/decorators.js";
import { Tester } from "./tester.js";

describe("compiler: when clause integration", () => {
  it("scoped decorators are NOT executed during checking", async () => {
    const [{ program }] = await Tester.compileAndDiagnose(`
      @doc("always") 
      @doc("csharp-only") when emitter("@typespec/http-client-csharp")
      model Bar {}
    `);

    const barType: Model = program.checker.getGlobalNamespaceType().models.get("Bar")!;
    ok(barType, "Bar model should exist");

    // The type has 2 decorator applications stored
    strictEqual(barType.decorators.length, 2);

    // But only the unconditional @doc("always") was executed — so getDoc returns "always"
    const doc = getDoc(program, barType);
    strictEqual(doc, "always", "Only unconditional @doc should be applied during checking");
  });

  it("applyScopedDecorators executes matching scoped decorators", async () => {
    const [{ program }] = await Tester.compileAndDiagnose(`
      @doc("default") 
      @doc("csharp-doc") when emitter("@typespec/http-client-csharp")
      model Foo {}
    `);

    const fooType: Model = program.checker.getGlobalNamespaceType().models.get("Foo")!;

    // Before applying scope, only "default" is active
    strictEqual(getDoc(program, fooType), "default");

    // Apply the C# scope — this executes the scoped @doc("csharp-doc")
    const csharpScope = createEmitterScope({ emitter: "@typespec/http-client-csharp" });
    applyScopedDecorators(program, fooType, csharpScope);

    // Now @doc("csharp-doc") has been executed — it overwrites "default" in state
    strictEqual(getDoc(program, fooType), "csharp-doc");
  });

  it("applyScopedDecorators does not execute non-matching scoped decorators", async () => {
    const [{ program }] = await Tester.compileAndDiagnose(`
      @doc("default") 
      @doc("csharp-doc") when emitter("@typespec/http-client-csharp")
      model Baz {}
    `);

    const bazType: Model = program.checker.getGlobalNamespaceType().models.get("Baz")!;

    // Apply Python scope — the csharp-scoped decorator should NOT execute
    const pythonScope = createEmitterScope({ emitter: "@typespec/http-client-python" });
    applyScopedDecorators(program, bazType, pythonScope);

    // Doc stays as "default"
    strictEqual(getDoc(program, bazType), "default");
  });

  it("applyScopedDecorators is idempotent (no double execution)", async () => {
    const [{ program }] = await Tester.compileAndDiagnose(`
      @doc("default")
      @doc("csharp-doc") when emitter("@typespec/http-client-csharp")
      model Qux {}
    `);

    const quxType: Model = program.checker.getGlobalNamespaceType().models.get("Qux")!;
    const csharpScope = createEmitterScope({ emitter: "@typespec/http-client-csharp" });

    // Apply twice — should not throw or cause issues
    applyScopedDecorators(program, quxType, csharpScope);
    applyScopedDecorators(program, quxType, csharpScope);

    strictEqual(getDoc(program, quxType), "csharp-doc");
  });

  it("getDecoratorsByScope filters correctly", async () => {
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

  it("demonstrates state pollution issue when multiple scopes applied", async () => {
    const [{ program }] = await Tester.compileAndDiagnose(`
      @doc("default")
      @doc("csharp-doc") when emitter("@typespec/http-client-csharp")
      @doc("python-doc") when emitter("@typespec/http-client-python")
      model Multi {}
    `);

    const multiType: Model = program.checker.getGlobalNamespaceType().models.get("Multi")!;

    // Initially only default
    strictEqual(getDoc(program, multiType), "default");

    // C# emitter applies its scope
    applyScopedDecorators(
      program,
      multiType,
      createEmitterScope({ emitter: "@typespec/http-client-csharp" }),
    );
    strictEqual(getDoc(program, multiType), "csharp-doc");

    // Python emitter applies its scope — this OVERWRITES the state!
    // This demonstrates the state pollution issue: shared state maps don't isolate per-scope
    applyScopedDecorators(
      program,
      multiType,
      createEmitterScope({ emitter: "@typespec/http-client-python" }),
    );
    strictEqual(
      getDoc(program, multiType),
      "python-doc",
      "State pollution: python-doc overwrites csharp-doc in shared state",
    );
  });
});
