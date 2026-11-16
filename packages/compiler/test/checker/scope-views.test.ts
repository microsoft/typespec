import { describe, expect, it } from "vitest";
import { getAutoDecoratorValue } from "../../src/core/auto-decorator.js";
import type { CompilerOptions } from "../../src/core/options.js";
import type { Program } from "../../src/core/program.js";
import {
  getScopeViews,
  registerScopeViewValidator,
  validateScopeViews,
} from "../../src/experimental/scope-views.js";
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

  it("rechecks template constraints after a scoped property type override without an emitter", async () => {
    const program = await compile(`
      enum Clients { csharp, python }
      model Required { id: string; }
      model Value {
        @Scopes.type(int32) when Clients.python
        id: string;
      }
      model Box<T extends Required> { value: T; }
      model Use { box: Box<Value>; }
    `);
    expectDiagnostics(program.diagnostics, { code: "invalid-scoped-type" });
    expect(program.diagnostics[0].message).toContain("python");
  });

  it("rechecks indexer compatibility after a scoped property type override", async () => {
    const program = await compile(`
      enum Clients { csharp, python }
      model Value extends Record<string> {
        @Scopes.type(int32) when Clients.python
        id: string;
      }
    `);
    expectDiagnostics(program.diagnostics, { code: "invalid-scoped-type" });
    expect(program.diagnostics[0].message).toContain("python");
    expect(program.diagnostics[0].message).toContain("indexer");
  });

  it("rechecks property defaults after a scoped type override", async () => {
    const program = await compile(`
      enum Clients { csharp, python }
      model Value {
        @Scopes.type(int32) when Clients.python
        id: string = "hello";
      }
    `);
    expectDiagnostics(program.diagnostics, { code: "invalid-scoped-type" });
    expect(program.diagnostics[0].message).toContain("python");
    expect(program.diagnostics[0].message).toContain("Default");
  });

  it("accepts a scoped type that includes the property's default value", async () => {
    const program = await compile(`
      enum Clients { csharp, python }
      model Value {
        @Scopes.type("hello") when Clients.python
        id: string = "hello";
      }
    `);
    expectDiagnosticEmpty(program.diagnostics);
    const python = getScopeViews(program).find((view) =>
      view.selections.some((selection) => selection.name === "python"),
    )!;
    const property = python.getGlobalNamespaceType().models.get("Value")!.properties.get("id")!;
    expect(property.defaultValue?.type).toBe(property.type);
  });

  it("uses a typed constant's declared type when rechecking a scoped default", async () => {
    const program = await compile(`
      enum Clients { csharp, python }
      const greeting: string = "hello";
      model Value {
        @Scopes.type("hello") when Clients.python
        id: string = greeting;
      }
    `);
    expectDiagnostics(program.diagnostics, { code: "invalid-scoped-type" });
    expect(program.diagnostics[0].message).toContain("python");
  });

  it("rechecks an object default when a nested scoped type changes", async () => {
    const program = await compile(`
      enum Clients { csharp, python }
      model Details {
        @Scopes.type(int32) when Clients.python
        id: string;
      }
      model Value {
        details: Details = #{ id: "hello" };
      }
    `);
    expectDiagnostics(program.diagnostics, { code: "invalid-scoped-type" });
    expect(program.diagnostics[0].message).toContain("python");
  });

  it("propagates scoped types through model composition and operation is", async () => {
    const program = await compile(`
      enum Clients { csharp, python }
      model Value {
        @Scopes.type(int32) when Clients.python
        id: string;
      }
      model Copy is Value;
      model Spread { ...Value; }
      @Scopes.returnType(int32) when Clients.python
      op original(): string;
      op copied is original;
    `);
    expectDiagnosticEmpty(program.diagnostics);
    const [csharp, python] = getScopeViews(program);
    for (const [view, name] of [
      [csharp, "string"],
      [python, "int32"],
    ] as const) {
      const root = view.getGlobalNamespaceType();
      for (const model of ["Value", "Copy", "Spread"]) {
        expect(root.models.get(model)!.properties.get("id")!.type).toMatchObject({ name });
      }
      expect(root.operations.get("copied")!.returnType).toMatchObject({ name });
    }
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

  it("uses a scoped operation template instead of the default signature", async () => {
    const program = await compile(`
      enum Versions { v1, v2 }
      model Widget {}
      op ReadV1<T>(id: string): T;
      op ReadV2<T>(id: string, expand?: boolean): T;
      @Scopes.signature(ReadV1<Widget>) when Versions.v1
      op getWidget is ReadV2<Widget>;
      op copied is getWidget;
    `);
    expectDiagnosticEmpty(program.diagnostics);
    const base = program.getGlobalNamespaceType().operations.get("getWidget")!;
    expect([...base.parameters.properties.keys()]).toEqual(["id", "expand"]);
    for (const [view, expected] of getScopeViews(program).map(
      (view, index) => [view, index === 0 ? ["id"] : ["id", "expand"]] as const,
    )) {
      const root = view.getGlobalNamespaceType();
      for (const name of ["getWidget", "copied"]) {
        const operation = root.operations.get(name)!;
        expect([...operation.parameters.properties.keys()]).toEqual(expected);
        expect(operation.returnType).toBe(root.models.get("Widget"));
      }
    }
  });

  it("checks a scoped operation template against scoped argument types without an emitter", async () => {
    const program = await compile(`
      enum Clients { csharp, python }
      model Required { id: string; }
      model Widget {
        @Scopes.type(int32) when Clients.python
        id: string;
      }
      op ReadTemplate<T extends Required>(input: T): T;
      op Default(): string;
      @Scopes.signature(ReadTemplate<Widget>) when Clients.python
      op fetch is Default;
    `);
    expectDiagnostics(program.diagnostics, { code: "invalid-scoped-type" });
    expect(program.diagnostics[0].message).toContain("python");
  });

  it("resolves a chain of scoped operation signatures", async () => {
    const program = await compile(`
      enum Versions { v1, v2 }
      op Legacy(id: string): string;
      op Current(id: string, expand?: boolean): string;
      @Scopes.signature(Legacy) when Versions.v1
      op intermediate is Current;
      @Scopes.signature(intermediate) when Versions.v1
      op final is Current;
    `);
    expectDiagnosticEmpty(program.diagnostics);
    const [v1, v2] = getScopeViews(program);
    expect([
      ...v1.getGlobalNamespaceType().operations.get("final")!.parameters.properties.keys(),
    ]).toEqual(["id"]);
    expect([
      ...v2.getGlobalNamespaceType().operations.get("final")!.parameters.properties.keys(),
    ]).toEqual(["id", "expand"]);
  });

  it("composes return type overrides on a selected signature", async () => {
    const program = await compile(`
      enum Versions { v1, v2 }
      @Scopes.returnType(int32) when Versions.v1
      op Legacy(): string;
      @Scopes.signature(Legacy) when Versions.v1
      op current(): string;
      @Scopes.returnType(boolean) when Versions.v1
      op preferred is current;
    `);
    expectDiagnosticEmpty(program.diagnostics);
    const root = getScopeViews(program)[0].getGlobalNamespaceType();
    expect(root.operations.get("current")!.returnType).toMatchObject({ name: "int32" });
    expect(root.operations.get("preferred")!.returnType).toMatchObject({ name: "boolean" });
  });

  it("reports a cyclic scoped operation signature without an emitter", async () => {
    const program = await compile(`
      enum Versions { v1, v2 }
      @Scopes.signature(read) when Versions.v1
      op read(): string;
    `);
    expectDiagnostics(program.diagnostics, { code: "invalid-scoped-type" });
    expect(program.diagnostics[0].message).toContain("cyclic");
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
});
