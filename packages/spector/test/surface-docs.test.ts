import { resolvePath } from "@typespec/compiler";
import { createTester, mockFile } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { createSurfaceChecksManifest } from "../src/coverage/surface-checks-manifest.js";
import { listSurfaceDocs } from "../src/lib/decorators.js";

// A minimal stand-in for the client-generator decorators, declared under the
// same namespaces so derivation matches them by name+namespace without spector
// having to depend on the real client-generator package.
const clientGeneratorTsp = `
  import "./client-generator.js";
  using TypeSpec.Reflection;

  namespace Azure.ClientGenerator.Core {
    enum Access {
      public: "public",
      internal: "internal",
    }
    extern dec clientName(target: unknown, rename: valueof string, scope?: valueof string);
    extern dec access(target: unknown, value: EnumMember, scope?: valueof string);
    extern dec clientLocation(
      target: unknown,
      to: Interface | Namespace | Operation | (valueof string),
      scope?: valueof string
    );
  }

  namespace Azure.ClientGenerator.Core.Legacy {
    extern dec hierarchyBuilding(target: Model, value: Model, scope?: valueof string);
  }
`;

const Tester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: ["@typespec/spector"],
})
  .files({
    "client-generator.js": mockFile.js({
      $decorators: {
        "Azure.ClientGenerator.Core": {
          clientName: () => {},
          access: () => {},
          clientLocation: () => {},
        },
        "Azure.ClientGenerator.Core.Legacy": {
          hierarchyBuilding: () => {},
        },
      },
    }),
    "client-generator.tsp": clientGeneratorTsp,
  })
  .importLibraries()
  .import("./client-generator.tsp")
  .using("Spector");

const spec = `
  @Azure.ClientGenerator.Core.clientName("ClientExtensibleEnum")
  @surfaceDoc("Exposed to clients as ClientExtensibleEnum, not its service name.")
  enum ServerExtensibleEnum {
    value1,
    value2,
  }

  @Azure.ClientGenerator.Core.access(Azure.ClientGenerator.Core.Access.internal)
  @Azure.ClientGenerator.Core.clientName("WidgetInternal")
  @surfaceDoc("Hidden from the public surface and renamed to WidgetInternal for clients.")
  model Widget {
    id: string;
  }

  model Animal {}

  @Azure.ClientGenerator.Core.Legacy.hierarchyBuilding(Pet)
  @surfaceDoc("Dog is surfaced as a subtype of Pet, not Animal.")
  model Dog extends Animal {
    kind: string;
  }

  model Pet {}

  @surfaceDoc("This operation surfaces a lazy paged iterator, not a raw response.")
  op listItems(): string[];
`;

describe("@surfaceDoc / listSurfaceDocs (natural language + derivation)", () => {
  it("keeps the prose and derives checks from client decorators", async () => {
    const { program } = await Tester.compile(spec);
    const docs = listSurfaceDocs(program);

    expect(docs.map((d) => d.name).sort()).toEqual([
      "Dog",
      "ServerExtensibleEnum",
      "Widget",
      "listItems",
    ]);

    const widget = docs.find((d) => d.name === "Widget")!;
    expect(widget.doc).toContain("Hidden from the public surface");
    // Two client decorators -> two derived checks.
    expect(widget.checks.map((c) => c.category).sort()).toEqual(["access", "naming"]);

    // Prose with no recognized client decorator -> no derived checks (AI fallback).
    const listItems = docs.find((d) => d.name === "listItems")!;
    expect(listItems.checks).toHaveLength(0);
    expect(listItems.doc).toContain("lazy paged iterator");
  });

  it("formats a verify.py-compatible manifest, prose carried on every item", async () => {
    const { program } = await Tester.compile(spec);
    const manifest = createSurfaceChecksManifest(".", "1.0.0", "abc123", listSurfaceDocs(program));

    const byId = Object.fromEntries(manifest.items.map((i) => [i.id, i]));

    expect(byId["ServerExtensibleEnum_naming"]).toMatchObject({
      category: "naming",
      target: "ServerExtensibleEnum",
      expected: "ClientExtensibleEnum",
      kind: "enum",
    });
    expect(byId["ServerExtensibleEnum_naming"].doc).toContain("Exposed to clients");

    expect(byId["Widget_access"]).toMatchObject({ category: "access", internal: true });
    expect(byId["Widget_naming"]).toMatchObject({ expected: "WidgetInternal", kind: "model" });

    // camelCase check fields are emitted snake_case for verify.py.
    expect(byId["Dog_hierarchy"].expected_base).toBe("Pet");

    // Prose-only element becomes a single AI-routed item.
    expect(byId["listItems_unspecified"]).toMatchObject({ category: "unspecified" });
    expect(byId["listItems_unspecified"].doc).toContain("lazy paged iterator");
    expect(byId["listItems_unspecified"].expected).toBeUndefined();
  });
});
