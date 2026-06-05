import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { Model } from "../src/core/types.js";
import {
  applyScopes,
  createEmitterScope,
  emitter,
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

  it("applyScopes returns a scoped program with executed scoped decorators", async () => {
    const [{ program }] = await Tester.compileAndDiagnose(`
      @doc("default") 
      @doc("csharp-doc") when emitter("@typespec/http-client-csharp")
      model Foo {}
    `);

    const fooType: Model = program.checker.getGlobalNamespaceType().models.get("Foo")!;

    // Base program only has unconditional state
    strictEqual(getDoc(program, fooType), "default");

    // Create a scoped program for C# emitter
    const scopedProgram = applyScopes(program, [emitter("@typespec/http-client-csharp")]);

    // Scoped program has the scoped @doc executed
    strictEqual(getDoc(scopedProgram, fooType), "csharp-doc");

    // Original program is NOT affected (isolation)
    strictEqual(getDoc(program, fooType), "default");
  });

  it("applyScopes does not execute non-matching scoped decorators", async () => {
    const [{ program }] = await Tester.compileAndDiagnose(`
      @doc("default") 
      @doc("csharp-doc") when emitter("@typespec/http-client-csharp")
      model Baz {}
    `);

    const bazType: Model = program.checker.getGlobalNamespaceType().models.get("Baz")!;

    // Apply Python scope — csharp-scoped decorator should NOT execute
    const scopedProgram = applyScopes(program, [emitter("@typespec/http-client-python")]);
    strictEqual(getDoc(scopedProgram, bazType), "default");
  });

  it("two emitters get different state from same program", async () => {
    const [{ program }] = await Tester.compileAndDiagnose(`
      @doc("default")
      @doc("csharp-doc") when emitter("@typespec/http-client-csharp")
      @doc("python-doc") when emitter("@typespec/http-client-python")
      model Multi {}
    `);

    const multiType: Model = program.checker.getGlobalNamespaceType().models.get("Multi")!;

    // Each emitter gets its own scoped view — no pollution
    const csharpProgram = applyScopes(program, [emitter("@typespec/http-client-csharp")]);
    const pythonProgram = applyScopes(program, [emitter("@typespec/http-client-python")]);

    strictEqual(getDoc(csharpProgram, multiType), "csharp-doc");
    strictEqual(getDoc(pythonProgram, multiType), "python-doc");

    // Base program unchanged
    strictEqual(getDoc(program, multiType), "default");
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

    const csharpDecs = getDecoratorsByScope(
      fooType,
      createEmitterScope({ emitter: "@typespec/http-client-csharp" }),
    );
    strictEqual(csharpDecs.length, 2);

    const pyDecs = getDecoratorsByScope(
      fooType,
      createEmitterScope({ emitter: "@typespec/http-client-python" }),
    );
    strictEqual(pyDecs.length, 2);

    const javaDecs = getDecoratorsByScope(
      fooType,
      createEmitterScope({ emitter: "@typespec/http-client-java" }),
    );
    strictEqual(javaDecs.length, 1);
  });
});
