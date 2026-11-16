import { getAutoDecoratorValue, type Program } from "@typespec/compiler";
import { getScopeViews, type ScopeView } from "@typespec/compiler/experimental";
import { expectDiagnostics } from "@typespec/compiler/testing";
import { expect, it } from "vitest";
import { Tester } from "./test-host.js";

const compilerOptions = {
  noEmit: true,
  configFile: {
    projectRoot: ".",
    kind: "project" as const,
    features: ["auto-decorators", "scoped-decorators"],
    diagnostics: [],
    outputDir: "tsp-output",
  },
};

function findView(program: Program, ...names: string[]): ScopeView {
  const view = getScopeViews(program).find((candidate) =>
    names.every((name) => candidate.selections.some((selection) => selection.name === name)),
  );
  expect(view, `view with ${names.join(", ")}`).toBeDefined();
  return view!;
}

it("selects scoped type and operation signatures with an explicit default", async () => {
  const { program } = await Tester.compile(
    `
    @versioned(Versions)
    namespace Service;
    enum Versions { v1, v2 }
    model Settings { enabled: boolean; }
    model Widget {
      @Scopes.type(string) when before(Versions.v2)
      settings: Settings;
    }
    op ReadV1<T>(id: string): T;
    op ReadV2<T>(id: string, expand?: boolean): T;
    @Scopes.signature(ReadV1<Widget>) when before(Versions.v2)
    op getWidget is ReadV2<Widget>;
  `,
    { compilerOptions },
  );
  const base = program.getGlobalNamespaceType().namespaces.get("Service")!;
  expect(base.models.get("Widget")!.properties.get("settings")!.type).toMatchObject({
    name: "Settings",
  });
  expect([...base.operations.get("getWidget")!.parameters.properties.keys()]).toEqual([
    "id",
    "expand",
  ]);
  for (const [version, settings, parameters] of [
    ["v1", "string", ["id"]],
    ["v2", "Settings", ["id", "expand"]],
  ] as const) {
    const service = findView(program, version).getGlobalNamespaceType().namespaces.get("Service")!;
    const widget = service.models.get("Widget")!;
    const operation = service.operations.get("getWidget")!;
    expect(widget.properties.get("settings")!.type).toMatchObject({ name: settings });
    expect([...operation.parameters.properties.keys()]).toEqual(parameters);
    expect(operation.returnType).toBe(widget);
  }
});

it("composes scoped metadata and members with versioning projections", async () => {
  const { program } = await Tester.compile(
    `
    @versioned(Versions)
    namespace Service;
    enum Versions { v1, v2 }
    enum Clients {
      csharp,
      @Scopes.parent(Clients.csharp) provisioning,
      python
    }
    auto dec clientName(target: unknown, name: valueof string);
    @clientName("CsWidget") when Clients.csharp
    @clientName("ProvisioningWidget") when Clients.provisioning & since(Versions.v2)
    model Widget {
      @renamedFrom(Versions.v2, "oldValue")
      @typeChangedFrom(Versions.v2, int32)
      @madeOptional(Versions.v2)
      value?: string;
      @added(Versions.v2)
      extra: string when Clients.csharp;
    }
  `,
    { compilerOptions },
  );
  const widgetIn = (view: ScopeView) =>
    view.getGlobalNamespaceType().namespaces.get("Service")!.models.get("Widget")!;
  const clientName = (view: ScopeView) =>
    getAutoDecoratorValue(view.program, "Service.clientName", widgetIn(view))?.name;

  const v1 = findView(program, "v1", "provisioning");
  expect(clientName(v1)).toBe("CsWidget");
  expect(widgetIn(v1).properties.get("oldValue")!.type).toMatchObject({ name: "int32" });
  expect(widgetIn(v1).properties.get("oldValue")!.optional).toBe(false);
  expect(widgetIn(v1).properties.has("extra")).toBe(false);

  const v2 = findView(program, "v2", "provisioning");
  expect(clientName(v2)).toBe("ProvisioningWidget");
  expect(widgetIn(v2).properties.get("value")!.optional).toBe(true);
  expect(widgetIn(v2).properties.has("extra")).toBe(true);

  expect(clientName(findView(program, "v2", "python"))).toBeUndefined();
  const widget = program.getGlobalNamespaceType().namespaces.get("Service")!.models.get("Widget")!;
  expect([...widget.properties.keys()]).toEqual(["value"]);
  expect(getAutoDecoratorValue(program, "Service.clientName", widget)).toBeUndefined();
});

it("implies dependency versions from the root service and keeps unrelated services separate", async () => {
  const { program } = await Tester.compile(
    `
    model ServiceMarker when since(Service.Versions.v2) {}
    model OtherMarker when since(Other.Versions.o2) {}
    @versioned(Versions)
    namespace Library {
      enum Versions { l1, l2 }
      model Item {
        @added(Versions.l2) extra: string;
      }
    }
    @versioned(Versions)
    namespace Service {
      enum Versions {
        @useDependency(Library.Versions.l1) v1,
        @useDependency(Library.Versions.l2) v2
      }
      model Request { item: Library.Item; }
    }
    @versioned(Versions)
    namespace Other {
      enum Versions { o1, o2 }
      model Unrelated {
        @added(Versions.o2) extra: string;
      }
    }
  `,
    { compilerOptions },
  );
  const views = getScopeViews(program);
  expect(views).toHaveLength(4);
  for (const view of views) {
    const names = view.selections.map((s) => s.name);
    expect(names.includes("l2")).toBe(names.includes("v2"));
  }
  for (const view of views) {
    const root = view.getGlobalNamespaceType();
    const libraryItem = root.namespaces.get("Library")!.models.get("Item")!;
    const unrelated = root.namespaces.get("Other")!.models.get("Unrelated")!;
    expect(libraryItem.properties.has("extra")).toBe(view.selections.some((s) => s.name === "v2"));
    expect(unrelated.properties.has("extra")).toBe(view.selections.some((s) => s.name === "o2"));
  }
});

it("only offers the pinned version of a dependency used by an unversioned service", async () => {
  const { program } = await Tester.compile(
    `
    enum Clients { csharp, python }
    @versioned(Versions)
    namespace Library {
      enum Versions { l1, l2 }
      model Item {
        @added(Versions.l2) extra: string;
      }
    }
    @useDependency(Library.Versions.l1)
    namespace Service {
      model Request { item: Library.Item when Clients.csharp; }
    }
  `,
    { compilerOptions },
  );
  for (const view of getScopeViews(program)) {
    expect(view.selections.some((s) => s.name === "l2")).toBe(false);
  }
});

it("reports a scoped reference to a removed type once, from the versioning validator", async () => {
  const diagnostics = await Tester.diagnose(
    `
    @versioned(Versions)
    namespace Service;
    enum Versions { v1, v2, v3 }
    enum Clients { csharp, python }
    @removed(Versions.v2)
    model Target {}
    model Source {
      target: Target when Clients.csharp;
    }
  `,
    { compilerOptions },
  );
  expectDiagnostics(diagnostics, [
    { code: "@typespec/versioning/incompatible-versioned-reference", severity: "error" },
  ]);
  expect(diagnostics[0].message).toContain("csharp");
});
