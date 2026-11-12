import { describe, expect, it } from "vitest";
import { getAutoDecoratorValue } from "../../src/core/auto-decorator.js";
import type { CompilerOptions } from "../../src/core/options.js";
import type { Program } from "../../src/core/program.js";
import {
  getScopeViews,
  registerScopeViewValidator,
  validateScopeViews,
} from "../../src/experimental/scope-views.js";
import { getDoc } from "../../src/lib/decorators.js";
import {
  createTestHost,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "../../src/testing/index.js";

const options: CompilerOptions = {
  noEmit: true,
  configFile: {
    projectRoot: ".",
    kind: "project",
    features: ["auto-decorators", "scoped-decorators"],
    diagnostics: [],
    outputDir: "tsp-output",
  },
};

async function compile(code: string) {
  const host = await createTestHost();
  host.addTypeSpecFile("main.tsp", code);
  await host.compileAndDiagnose("main.tsp", options);
  return host.program;
}

describe("integrated scope views", () => {
  it("inherits metadata, prefers a child regardless of source order, and keeps base metadata private", async () => {
    const program = await compile(`
      enum Clients {
        csharp,
        @Scopes.parent(Clients.csharp) provisioning,
        python
      }
      auto dec clientName(target: unknown, name: valueof string);
      @clientName("ProvisioningWidget") when Clients.provisioning
      @clientName("CsharpWidget") when Clients.csharp
      model Widget {}
    `);
    expectDiagnosticEmpty(program.diagnostics);
    const widget = program.getGlobalNamespaceType().models.get("Widget")!;
    const views = getScopeViews(program);
    const names = views.map((view) => view.getAutoDecoratorValue("clientName", widget)?.name);
    expect(names).toEqual(["CsharpWidget", "ProvisioningWidget", undefined]);
    expect(getAutoDecoratorValue(program, "clientName", widget)).toBeUndefined();
    const scopedProgram = views[1].getProgram();
    expect(getAutoDecoratorValue(scopedProgram, "clientName", widget)?.name).toBe(
      "ProvisioningWidget",
    );
  });

  it("reports incomparable overlapping metadata without an emitter requesting the view", async () => {
    const program = await compile(`
      enum Clients { csharp, python }
      auto dec clientName(target: unknown, name: valueof string);
      @clientName("Csharp") when Clients.csharp
      @clientName("Read") when Lifecycle.Read
      model Widget {}
    `);
    expectDiagnostics(program.diagnostics, { code: "ambiguous-scoped-value" });
  });

  it("allows an explicit intersection to resolve an overlap", async () => {
    const program = await compile(`
      enum Clients { csharp, python }
      auto dec clientName(target: unknown, name: valueof string);
      @clientName("Both") when Clients.csharp & Lifecycle.Read
      @clientName("Csharp") when Clients.csharp
      @clientName("Read") when Lifecycle.Read
      model Widget {}
    `);
    expectDiagnosticEmpty(program.diagnostics);
    const view = getScopeViews(program).find(
      (v) =>
        v.selections.some((s) => s.name === "csharp") &&
        v.selections.some((s) => s.name === "Read"),
    )!;
    const widget = program.getGlobalNamespaceType().models.get("Widget")!;
    expect(view.getAutoDecoratorValue("clientName", widget)?.name).toBe("Both");
  });

  it("checks references in an unselected scope", async () => {
    const program = await compile(`
      enum Clients { csharp, python }
      model Private when Clients.csharp { value: string; }
      model Common { value: Private; }
    `);
    expectDiagnostics(program.diagnostics, { code: "incompatible-scoped-reference" });
    expect(program.diagnostics[0].message).toContain("python");
  });

  it("filters cloned members and real visibility modifiers without changing the base graph", async () => {
    const program = await compile(`
      enum Clients { csharp, python }
      model Original {
        @visibility(Lifecycle.Read) id: string;
        extra: string when Clients.csharp;
      }
      model Copy is Original;
      model Spread { ...Original; }
      model Derived extends Original {}
    `);
    expectDiagnosticEmpty(program.diagnostics);
    const view = getScopeViews(program).find(
      (v) =>
        v.selections.some((s) => s.name === "python") &&
        v.selections.some((s) => s.name === "Create"),
    )!;
    const root = view.getGlobalNamespaceType();
    expect([...root.models.get("Copy")!.properties]).toEqual([]);
    expect([...root.models.get("Spread")!.properties]).toEqual([]);
    expect([...root.models.get("Derived")!.baseModel!.properties]).toEqual([]);
    expect(program.getGlobalNamespaceType().models.get("Original")!.properties.size).toBe(2);
  });

  it("discovers default visibility classes and filters otherwise unannotated properties", async () => {
    const program = await compile(`
      enum Clients { csharp }
      @defaultVisibility(Views.read)
      enum Views { read, write }
      model Marker when Clients.csharp {}
      model Widget { shared: string; }
    `);
    expectDiagnosticEmpty(program.diagnostics);
    const views = getScopeViews(program);
    expect(views).toHaveLength(2);
    for (const view of views) {
      expect(view.getGlobalNamespaceType().models.get("Widget")!.properties.has("shared")).toBe(
        view.selections.some((s) => s.name === "read"),
      );
    }
    expect(program.getGlobalNamespaceType().models.get("Widget")!.properties.has("shared")).toBe(
      true,
    );
  });

  it("rejects an empty view universe rather than silently skipping validation", async () => {
    const program = await compile(`
      enum Clients { csharp }
      @defaultVisibility()
      enum Views {}
      model Marker when Clients.csharp {}
    `);
    expectDiagnostics(program.diagnostics, { code: "invalid-scope-condition" });
    expect(program.diagnostics[0].message).toContain("no valid concrete views");
  });

  it("rejects a hierarchy cycle rather than recursing forever", async () => {
    const program = await compile(`
      enum Clients {
        @Scopes.parent(Clients.b) a,
        @Scopes.parent(Clients.a) b
      }
      auto dec label(target: unknown, value: valueof string);
      @label("x") when Clients.a
      model Widget {}
    `);
    expectDiagnostics(program.diagnostics, { code: "invalid-scope-hierarchy" });
  });

  it("rechecks template constraints against every filtered graph", async () => {
    const program = await compile(`
      enum Clients { csharp, python }
      model Required { id: string; }
      model Value { id: string when Clients.csharp; }
      model Box<T extends Required> { value: T; }
      model Use { box: Box<Value>; }
    `);
    expectDiagnostics(program.diagnostics, { code: "invalid-scoped-type" });
    expect(program.diagnostics[0].message).toContain("python");
  });

  it("checks structural declaration references, not only property types", async () => {
    const program = await compile(`
      enum Clients { csharp, python }
      model Private when Clients.csharp {}
      model Copy is Private;
    `);
    expectDiagnostics(program.diagnostics, { code: "incompatible-scoped-reference" });
  });

  it.each([
    "op request<T extends Required>(value: T): T; op use is request<Value>;",
    "interface Box<T extends Required> { get(): T; } interface Use extends Box<Value> {}",
  ])("rechecks non-model template constraints: %s", async (declarations) => {
    const program = await compile(`
      enum Clients { csharp, python }
      model Required { id: string; }
      model Value { id: string when Clients.csharp; }
      ${declarations}
    `);
    expectDiagnostics(program.diagnostics, { code: "invalid-scoped-type" });
    expect(program.diagnostics[0].message).toContain("python");
  });

  it("does not execute extern decorators again while constructing scope views", async () => {
    const host = await createTestHost();
    let calls = 0;
    host.addJsFile("decorators.js", {
      $count() {
        calls++;
      },
    });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./decorators.js";
      extern dec count(target: unknown);
      enum Clients { csharp, python }
      @count model Widget when Clients.csharp {}
    `,
    );
    await host.compile("main.tsp", options);
    expect(getScopeViews(host.program)).toHaveLength(2);
    expect(calls).toBe(1);
  });

  it("runs opt-in library validation on every view without an emitter", async () => {
    const host = await createTestHost();
    const checked: string[] = [];
    host.addJsFile("validation.js", {
      $onValidate(program: Program) {
        registerScopeViewValidator(program, (view) => {
          checked.push(view.name);
          return [];
        });
      },
    });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./validation.js";
      enum Clients { csharp, python }
      model Widget when Clients.csharp {}
    `,
    );
    await host.compile("main.tsp", options);
    expect(checked).toEqual(["Clients.csharp", "Clients.python"]);
  });

  it("resolves structural facets without redefining symbols or changing the base graph", async () => {
    const program = await compile(`
      enum Clients { csharp, python }
      @Scopes.name("CsWidget") when Clients.csharp
      model Widget {
        @Scopes.type(int32) when Clients.csharp
        @Scopes.optional(true) when Clients.python
        value: string;
      }
      @Scopes.returnType(Widget) when Clients.csharp
      op get(): string;
    `);
    expectDiagnosticEmpty(program.diagnostics);
    const [csharp, python] = getScopeViews(program);
    const root = csharp.getGlobalNamespaceType();
    const widget = root.models.get("CsWidget")!;
    expect(widget.properties.get("value")!.type).toMatchObject({ kind: "Scalar", name: "int32" });
    expect(root.operations.get("get")!.returnType).toBe(widget);
    expect(
      python.getGlobalNamespaceType().models.get("Widget")!.properties.get("value")!.optional,
    ).toBe(true);
    const base = program.getGlobalNamespaceType().models.get("Widget")!;
    expect(base.properties.get("value")!.type).toMatchObject({ kind: "Scalar", name: "string" });
    expect(base.properties.get("value")!.optional).toBe(false);
  });

  it("rejects names that collide only in a scoped view", async () => {
    const program = await compile(`
      enum Clients { csharp, python }
      model Widget {
        first: string;
        @Scopes.name("first") when Clients.csharp
        second: string;
      }
    `);
    expectDiagnostics(program.diagnostics, { code: "invalid-scoped-type" });
    expect(program.diagnostics[0].message).toContain("collides");
  });

  it("checks arguments even when no consumer requests the scoped metadata", async () => {
    const program = await compile(`
      enum Clients { csharp, python }
      auto dec label(target: unknown, value: valueof string);
      @label(123) when Clients.python
      model Widget {}
    `);
    expectDiagnostics(program.diagnostics, { code: "invalid-argument" });
  });

  it("does not accumulate diagnostics when validation is requested again", async () => {
    const program = await compile(`
      enum Clients { csharp, python }
      model Private when Clients.csharp {}
      model Common { value: Private; }
    `);
    const count = program.diagnostics.length;
    validateScopeViews(program);
    expect(program.diagnostics).toHaveLength(count);
  });

  describe("alternatives", () => {
    it("selects a property type per view, falls back to else, and is absent without a match", async () => {
      const program = await compile(`
        enum Versions { v1, v2, v3 }
        model Widget {
          settings: when { Versions.v1 => string, else => int32 };
          legacy: when { Versions.v1 => boolean };
        }
      `);
      expectDiagnosticEmpty(program.diagnostics);
      const [v1, v2] = getScopeViews(program).map(
        (view) => view.getGlobalNamespaceType().models.get("Widget")!.properties,
      );
      expect(v1.get("settings")!.type).toMatchObject({ kind: "Scalar", name: "string" });
      expect(v1.has("legacy")).toBe(true);
      expect(v2.get("settings")!.type).toMatchObject({ kind: "Scalar", name: "int32" });
      expect(v2.has("legacy")).toBe(false);
    });

    it("swaps an operation's 'is' template per view and keeps shared decorators", async () => {
      const program = await compile(`
        enum Versions { v1, v2 }
        op ReadV1(id: string): string;
        op ReadV2(id: string, expand?: boolean): string;
        @doc("Read it")
        op read when {
          Versions.v1 => is ReadV1,
          Versions.v2 => is ReadV2,
        };
      `);
      expectDiagnosticEmpty(program.diagnostics);
      for (const [view, params] of getScopeViews(program).map(
        (view, i) => [view, i === 0 ? ["id"] : ["id", "expand"]] as const,
      )) {
        const read = view.getGlobalNamespaceType().operations.get("read")!;
        expect([...read.parameters.properties.keys()]).toEqual(params);
        expect(getDoc(view.getProgram(), read)).toBe("Read it");
      }
    });

    it("prefers the most specific overlapping branch", async () => {
      const program = await compile(`
        enum Versions { v1, v2, v3 }
        model Widget {
          value: when { Versions.v2 | Versions.v3 => string, Versions.v3 => int32 };
        }
      `);
      expectDiagnosticEmpty(program.diagnostics);
      const types = getScopeViews(program).map(
        (view) => view.getGlobalNamespaceType().models.get("Widget")!.properties.get("value")?.type,
      );
      expect(types[0]).toBeUndefined();
      expect(types[1]).toMatchObject({ name: "string" });
      expect(types[2]).toMatchObject({ name: "int32" });
    });

    it("reports incomparable overlapping branches", async () => {
      const program = await compile(`
        enum Versions { v1, v2, v3 }
        model Widget {
          value: when { Versions.v1 | Versions.v2 => string, Versions.v2 | Versions.v3 => int32 };
        }
      `);
      expectDiagnostics(program.diagnostics, { code: "ambiguous-scoped-alternative" });
    });
  });
});
