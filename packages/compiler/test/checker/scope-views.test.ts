import { describe, expect, it } from "vitest";
import type { CompilerOptions } from "../../src/core/options.js";
import type { Program } from "../../src/core/program.js";
import { getScopeViews } from "../../src/experimental/scope-views.js";
import { getDoc } from "../../src/lib/decorators.js";
import {
  createTestHost,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "../../src/testing/index.js";

function options(features = ["auto-decorators", "scoped-decorators"]): CompilerOptions {
  return {
    noEmit: true,
    configFile: { projectRoot: ".", kind: "project", features, diagnostics: [], outputDir: "out" },
  };
}

async function compile(code: string, features?: string[]) {
  const host = await createTestHost();
  host.addTypeSpecFile("main.tsp", code);
  await host.compileAndDiagnose("main.tsp", options(features));
  return host.program;
}

function view(program: Program, name: string) {
  const result = getScopeViews(program).find((x) => x.name === name);
  expect(result, `view ${name}`).toBeDefined();
  return result!;
}

function model(program: Program, name: string) {
  return program.getGlobalNamespaceType().models.get(name);
}

const clients = `enum Clients { csharp, python, java }`;

describe("default view", () => {
  it("excludes conditional declarations and members", async () => {
    const program = await compile(`
      ${clients}
      model Csharp when Clients.csharp {}
      model Widget {
        id: string;
        name: string when Clients.csharp;
        name: int32 when Clients.python;
      }
    `);
    expectDiagnosticEmpty(program.diagnostics);
    expect(model(program, "Csharp")).toBeUndefined();
    expect([...model(program, "Widget")!.properties.keys()]).toEqual(["id"]);

    const csharp = view(program, "Clients.csharp").program;
    expect(model(csharp, "Csharp")).toBeDefined();
    expect(model(csharp, "Widget")!.properties.get("name")!.type).toMatchObject({ name: "string" });
    const python = view(program, "Clients.python").program;
    expect(model(python, "Widget")!.properties.get("name")!.type).toMatchObject({ name: "int32" });
  });

  it("reports references to declarations absent from the default view", async () => {
    const program = await compile(`
      ${clients}
      model Csharp when Clients.csharp {}
      model Widget {
        ok: Csharp when Clients.csharp;
        bad: Csharp;
      }
    `);
    expectDiagnostics(program.diagnostics, {
      code: "incompatible-scoped-reference",
      message: "'Csharp' is not present in scope view 'default'.",
    });
  });
});

describe("per-view checking", () => {
  it("re-runs decorator validation with the view's types", async () => {
    const program = await compile(`
      ${clients}
      model Widget {
        @pattern("^a") @Scopes.type(int32) when Clients.python name: string;
      }
    `);
    expectDiagnostics(program.diagnostics, {
      code: "decorator-wrong-target",
      message: /\(in scope view: Clients.python\)$/,
    });
  });

  it("recomputes template instances per view", async () => {
    const program = await compile(`
      ${clients}
      model Copy<T> { ...T }
      model Widget { id: string; extra: string when Clients.csharp; }
      model WidgetCopy is Copy<Widget>;
    `);
    expectDiagnosticEmpty(program.diagnostics);
    expect([...model(program, "WidgetCopy")!.properties.keys()]).toEqual(["id"]);
    const csharp = view(program, "Clients.csharp").program;
    expect([...model(csharp, "WidgetCopy")!.properties.keys()]).toEqual(["id", "extra"]);
  });

  it("detects collisions introduced by a scoped rename in either order", async () => {
    for (const body of [
      `@Scopes.name("b") when Clients.csharp a: string; b: string;`,
      `b: string; @Scopes.name("b") when Clients.csharp a: string;`,
    ]) {
      const program = await compile(`${clients} model Widget { ${body} }`);
      expectDiagnostics(program.diagnostics, { code: "duplicate-property" });
    }
  });

  it("applies the signature facet like 'is', including the operation decorators", async () => {
    const program = await compile(`
      ${clients}
      @doc("v2 read") op readV2(id: string, expand: boolean): string;
      @Scopes.signature(readV2) when Clients.csharp
      op read(id: string): string;
    `);
    expectDiagnosticEmpty(program.diagnostics);
    const csharp = view(program, "Clients.csharp").program;
    const read = csharp.getGlobalNamespaceType().operations.get("read")!;
    expect([...read.parameters.properties.keys()]).toEqual(["id", "expand"]);
    expect(getDoc(csharp, read)).toBe("v2 read");
  });

  it("merges views that have the same truth value for every condition", async () => {
    const program = await compile(`
      ${clients}
      model Widget { name: string when Clients.csharp; }
    `);
    const views = getScopeViews(program);
    expect(views.map((x) => x.name)).toEqual(["Clients.csharp", "Clients.java", "Clients.python"]);
    expect(new Set(views.map((x) => x.program)).size).toBe(2);
  });
});

describe("decorator selection", () => {
  it("picks the most specific application of any decorator kind, including augments", async () => {
    const program = await compile(`
      enum Clients { csharp, @Scopes.parent(Clients.csharp) provisioning, python }
      @@doc(Widget, "provisioning") when Clients.provisioning;
      @doc("csharp") when Clients.csharp
      @doc("default")
      model Widget {}
    `);
    expectDiagnosticEmpty(program.diagnostics);
    const docOf = (p: Program) => getDoc(p, model(p, "Widget")!);
    expect(docOf(program)).toBe("default");
    expect(docOf(view(program, "Clients.python").program)).toBe("default");
    expect(docOf(view(program, "Clients.provisioning").program)).toBe("provisioning");
    // `csharp` has a child, so it is abstract and not a view of its own.
    expect(getScopeViews(program).map((x) => x.name)).toEqual([
      "Clients.provisioning",
      "Clients.python",
    ]);
  });

  it("reports incomparable overlapping applications", async () => {
    const program = await compile(`
      ${clients}
      enum Targets { client, server }
      @doc("a") when Clients.csharp
      @doc("b") when Targets.client
      model Widget {}
    `);
    expectDiagnostics(program.diagnostics, {
      code: "ambiguous-scoped-value",
      message: /in scope view: Clients.csharp \+ Targets.client/,
    });
  });

  it("orders ranges by implication, independent of the declared versions", async () => {
    const program = await compile(`
      enum Versions { v1, v2, v3 }
      @doc("since v1") when since(Versions.v1)
      @doc("since v2") when since(Versions.v2)
      model Widget {}
    `);
    expectDiagnosticEmpty(program.diagnostics);
    const docOf = (name: string) => {
      const p = view(program, name).program;
      return getDoc(p, model(p, "Widget")!);
    };
    expect([docOf("Versions.v1"), docOf("Versions.v2"), docOf("Versions.v3")]).toEqual([
      "since v1",
      "since v2",
      "since v2",
    ]);
  });
});

describe("validation", () => {
  it("rejects visibility classes as scope axes", async () => {
    const program = await compile(`
      model Widget { @visibility(Lifecycle.Read) id: string when Lifecycle.Read; }
    `);
    expectDiagnostics(program.diagnostics, {
      code: "invalid-scope-condition",
      message: /visibility class/,
    });
  });

  it("warns about conditions no view satisfies", async () => {
    const program = await compile(`
      ${clients}
      model Widget { name: string when Clients.csharp & Clients.python; }
    `);
    expectDiagnostics(program.diagnostics, { code: "unreachable-scope-condition" });
  });

  it("requires the scoped-decorators feature", async () => {
    const program = await compile(`${clients} model Widget { a: string when Clients.csharp; }`, []);
    expectDiagnostics(program.diagnostics, { code: "scoped-decorator-disabled" });
  });

  it("keeps 'when' usable as an identifier", async () => {
    const program = await compile(`
      enum Kind { when, other }
      model Event { @doc("x") when: utcDateTime; }
    `);
    expectDiagnosticEmpty(program.diagnostics);
    expect(model(program, "Event")!.properties.has("when")).toBe(true);
  });
});
