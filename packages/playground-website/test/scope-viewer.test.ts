import { getScopeViews } from "@typespec/compiler/experimental";
import { createTestHost, expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { VersioningTestLibrary } from "@typespec/versioning/testing";
import { expect, it } from "vitest";
import {
  getScopeMemberChanges,
  renderScopeType,
  selectScopeView,
} from "../src/scope-viewer-model.js";

async function compile(source: string) {
  const host = await createTestHost({ libraries: [VersioningTestLibrary] });
  host.addTypeSpecFile("main.tsp", source);
  const [, diagnostics] = await host.compileAndDiagnose("main.tsp", {
    noEmit: true,
    configFile: {
      kind: "project",
      projectRoot: ".",
      outputDir: "tsp-output",
      diagnostics: [],
      features: ["auto-decorators", "scoped-decorators"],
    },
  });
  expectDiagnosticEmpty(diagnostics);
  return host.program;
}

it("renders resolved version types and visibility changes without legacy decorators", async () => {
  const program = await compile(`
    enum Versions { v1, v2 }
    enum Views { read, write }
    union Value {
      old: int32 when Versions.v1,
      current: string when Versions.v2,
    }
    model Widget {
      value: Value;
      id: string when Views.read;
      secret: string when Views.write;
    }
  `);
  const original = program.getGlobalNamespaceType().models.get("Widget")!;
  const views = getScopeViews(program);
  const v1 = selectScopeView(views, views[0], "Versions", "v1")!;
  const read = selectScopeView(views, v1, "Views", "read")!;
  const v2 = selectScopeView(views, read, "Versions", "v2")!;
  const write = selectScopeView(views, v2, "Views", "write")!;
  expect(renderScopeType(read.getType(original))).toContain("value: int32;");
  expect(renderScopeType(write.getType(original))).toContain("value: string;");
  expect(renderScopeType(write.getType(original))).not.toContain("id:");
  expect(getScopeMemberChanges(original, write.getType(original))).toMatchObject([
    { name: "value", status: "changed" },
    { name: "id", status: "removed" },
    { name: "secret", status: "unchanged" },
  ]);
});

it("adjusts dependent version axes while preserving independent selections", async () => {
  const program = await compile(`
    import "@typespec/versioning";
    using Versioning;
    enum Clients { csharp, python }
    model Marker when Clients.csharp {}
    @versioned(Versions)
    namespace Library {
      enum Versions { l1, l2 }
      model Item {}
    }
    @versioned(Versions)
    namespace Service {
      enum Versions {
        @useDependency(Library.Versions.l1) v1,
        @useDependency(Library.Versions.l2) v2,
      }
      model Request { item: Library.Item; }
    }
  `);
  const views = getScopeViews(program);
  const python = views.find(
    (v) =>
      v.selections.some((s) => s.name === "python") && v.selections.some((s) => s.name === "v1"),
  )!;
  const selected = selectScopeView(views, python, "Library.Versions", "l2")!;
  expect(selected.selections.map((s) => s.name)).toEqual(
    expect.arrayContaining(["python", "v2", "l2"]),
  );
});

it("renders view-only type, optionality and name facets and absent declarations", async () => {
  const program = await compile(`
    enum Views { read, write }
    @Scopes.name("Request") when Views.write
    model Widget {
      @Scopes.type(int32) when Views.write
      @Scopes.optional(true) when Views.write
      value: string;
    }
    model Result when Views.read { id: string; }
  `);
  const view = getScopeViews(program).find((v) => v.selections[0].name === "write")!;
  const original = program.getGlobalNamespaceType().models.get("Widget")!;
  const result = program.getGlobalNamespaceType().models.get("Result")!;
  expect(renderScopeType(view.getType(original))).toContain("model Request");
  expect(renderScopeType(view.getType(original))).toContain("value?: int32;");
  expect(getScopeMemberChanges(original, view.getType(original))).toMatchObject([
    { name: "value", status: "changed" },
  ]);
  expect(renderScopeType(view.isPresent(result) ? view.getType(result) : undefined)).toContain(
    "not present",
  );
});
