import { getAutoDecoratorValue } from "@typespec/compiler";
import { getScopeViews } from "@typespec/compiler/experimental";
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

it("composes scoped metadata and members with real versioning and visibility", async () => {
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
      @visibility(Lifecycle.Read) id: string;
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
  const service = program.getGlobalNamespaceType().namespaces.get("Service")!;
  const widget = service.models.get("Widget")!;
  const views = getScopeViews(program);
  expect(views).toHaveLength(30);
  const readV1 = views.find(
    (v) =>
      v.selections.some((s) => s.name === "v1") &&
      v.selections.some((s) => s.name === "provisioning") &&
      v.selections.some((s) => s.name === "Read"),
  )!;
  const viewWidget = readV1
    .getGlobalNamespaceType()
    .namespaces.get("Service")!
    .models.get("Widget")!;
  expect(readV1.getAutoDecoratorValue("Service.clientName", viewWidget)?.name).toBe("CsWidget");
  expect(viewWidget.properties.get("oldValue")!.type).toMatchObject({
    kind: "Scalar",
    name: "int32",
  });
  expect(viewWidget.properties.get("oldValue")!.optional).toBe(false);
  expect(viewWidget.properties.has("extra")).toBe(false);
  const createV2 = views.find(
    (v) =>
      v.selections.some((s) => s.name === "v2") &&
      v.selections.some((s) => s.name === "provisioning") &&
      v.selections.some((s) => s.name === "Create"),
  )!;
  const createWidget = createV2.getType(widget);
  expect(createV2.getAutoDecoratorValue("Service.clientName", createWidget)?.name).toBe(
    "ProvisioningWidget",
  );
  expect(createWidget.properties.has("id")).toBe(false);
  expect(createWidget.properties.has("extra")).toBe(true);
  expect(createWidget.properties.get("value")!.type).toMatchObject({
    kind: "Scalar",
    name: "string",
  });
  expect(createWidget.properties.get("value")!.optional).toBe(true);
  expect([...widget.properties.keys()]).toEqual(["id", "value", "extra"]);
  expect(getAutoDecoratorValue(program, "Service.clientName", widget)).toBeUndefined();
});

it("keeps independent timelines separate and honors dependency version selections", async () => {
  const { program } = await Tester.compile(
    `
    enum Clients { csharp, python }
    model Marker when Clients.csharp {}
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
  expect(views).toHaveLength(8);
  for (const view of views) {
    const root = view.getGlobalNamespaceType();
    const hasLibraryExtra = root.namespaces
      .get("Library")!
      .models.get("Item")!
      .properties.has("extra");
    const hasOtherExtra = root.namespaces
      .get("Other")!
      .models.get("Unrelated")!
      .properties.has("extra");
    expect(hasLibraryExtra).toBe(view.selections.some((s) => s.name === "v2"));
    expect(hasOtherExtra).toBe(view.selections.some((s) => s.name === "o2"));
  }
});

it("validates a reference to a removed target at every version without an emitter", async () => {
  const [{ program }, diagnostics] = await Tester.compileAndDiagnose(
    `
    @versioned(Versions)
    namespace Service;
    enum Versions { v1, v2, v3 }
    enum Clients { csharp, python }
    @removed(Versions.v2)
    model Target {}
    @added(Versions.v1)
    model Source {
      target: Target when Clients.csharp;
    }
  `,
    { compilerOptions },
  );
  const views = getScopeViews(program);
  expect(views).toHaveLength(6);
  const view = views.find(
    (v) =>
      v.selections.some((s) => s.name === "v2") && v.selections.some((s) => s.name === "csharp"),
  )!;
  const target = program.getGlobalNamespaceType().namespaces.get("Service")!.models.get("Target")!;
  expect(view.isPresent(target)).toBe(false);
  expect(
    view
      .getGlobalNamespaceType()
      .namespaces.get("Service")!
      .models.get("Source")!
      .properties.has("target"),
  ).toBe(true);
  const property = view
    .getGlobalNamespaceType()
    .namespaces.get("Service")!
    .models.get("Source")!
    .properties.get("target")!;
  expect(view.isPresent(property)).toBe(true);
  expect(view.isPresent(property.type)).toBe(false);
  expectDiagnostics(diagnostics, { code: "incompatible-scoped-reference" });
  expect(diagnostics[0].message).toContain("v2");
});
