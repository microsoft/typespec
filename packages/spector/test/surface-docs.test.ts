import { resolvePath } from "@typespec/compiler";
import { createTester, mockFile } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import {
  createSurfaceChecksManifest,
  type SurfaceCheckItem,
} from "../src/coverage/surface-checks-manifest.js";
import { listSurfaceDocs, type SurfaceCheck } from "../src/lib/decorators.js";

// A minimal stand-in for the client-generator decorators, declared under the
// same namespaces so derivation matches them by name+namespace without spector
// having to depend on the (separate-repo) client-generator package. Core
// decorators like `@list` are real and need no stub.
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

/** Compile `code` and return the derived checks of its single `@surfaceDoc`. */
async function checksOf(code: string): Promise<SurfaceCheck[]> {
  const { program } = await Tester.compile(code);
  const docs = listSurfaceDocs(program);
  expect(docs).toHaveLength(1);
  return docs[0].checks;
}

/** Compile `code` and return the surface-checks.json items keyed by id. */
async function manifestItems(code: string): Promise<Record<string, SurfaceCheckItem>> {
  const { program } = await Tester.compile(code);
  const manifest = createSurfaceChecksManifest(".", "1.0.0", "abc123", listSurfaceDocs(program));
  return Object.fromEntries(manifest.items.map((i) => [i.id, i]));
}

describe("@surfaceDoc", () => {
  it("retains the authored prose", async () => {
    const { program } = await Tester.compile(`
      @surfaceDoc("Surfaces a lazy paged iterator on the client, not a raw response.")
      op listItems(): string[];
    `);
    expect(listSurfaceDocs(program)[0].doc).toBe(
      "Surfaces a lazy paged iterator on the client, not a raw response.",
    );
  });

  // --- derivation, by category -------------------------------------------

  it("naming: derived from @clientName", async () => {
    expect(
      await checksOf(`
        @Azure.ClientGenerator.Core.clientName("ClientExtensibleEnum")
        @surfaceDoc("Exposed to clients as ClientExtensibleEnum.")
        enum ServerExtensibleEnum {
          value1,
          value2,
        }
      `),
    ).toEqual([{ category: "naming", details: { name: "ClientExtensibleEnum", kind: "enum" } }]);
  });

  it("access: derived from @access", async () => {
    expect(
      await checksOf(`
        @Azure.ClientGenerator.Core.access(Azure.ClientGenerator.Core.Access.internal)
        @surfaceDoc("Hidden from the public client surface.")
        model Widget {
          id: string;
        }
      `),
    ).toEqual([{ category: "access", details: { internal: true } }]);
  });

  it("hierarchy: derived from @hierarchyBuilding", async () => {
    expect(
      await checksOf(`
        model Animal {}
        model Pet {}

        @Azure.ClientGenerator.Core.Legacy.hierarchyBuilding(Pet)
        @surfaceDoc("Dog is surfaced as a subtype of Pet, not Animal.")
        model Dog extends Animal {
          kind: string;
        }
      `),
    ).toEqual([{ category: "hierarchy", details: { base: "Pet" } }]);
  });

  it("client-location: derived from @clientLocation, absent from the declaring container", async () => {
    expect(
      await checksOf(`
        interface WidgetOps {
          @Azure.ClientGenerator.Core.clientLocation("BatchClient")
          @surfaceDoc("Surfaced on BatchClient instead of WidgetOps.")
          op batchGet(): void;
        }
      `),
    ).toEqual([
      {
        category: "client-location",
        details: { client: "BatchClient", absentFrom: "WidgetOps" },
      },
    ]);
  });

  it("paging: derived from the core @list decorator", async () => {
    expect(
      await checksOf(`
        @surfaceDoc("Surfaces a lazy paged iterator on the client.")
        @list
        op listItems(): { @pageItems items: string[]; @nextLink next?: url };
      `),
    ).toEqual([{ category: "paging" }]);
  });

  it("multiple: one check per decorator when several are applied", async () => {
    const checks = await checksOf(`
      @Azure.ClientGenerator.Core.access(Azure.ClientGenerator.Core.Access.internal)
      @Azure.ClientGenerator.Core.clientName("WidgetInternal")
      @surfaceDoc("Hidden from the public surface and renamed to WidgetInternal.")
      model Widget {
        id: string;
      }
    `);
    expect(checks).toContainEqual({ category: "access", details: { internal: true } });
    expect(checks).toContainEqual({
      category: "naming",
      details: { name: "WidgetInternal", kind: "model" },
    });
  });

  it("prose-only: no checks when no decorator is recognized (AI fallback)", async () => {
    expect(
      await checksOf(`
        @surfaceDoc("The response body is surfaced as a strongly typed model.")
        op getItem(): { id: string };
      `),
    ).toHaveLength(0);
  });

  // --- explicit check supplied on @surfaceDoc ----------------------------

  it("explicit: adds a categorized check when no decorator backs the prose", async () => {
    expect(
      await checksOf(`
        @surfaceDoc("Surfaces a lazy paged iterator on the client.", #{ category: "paging" })
        op listItems(): string[];
      `),
    ).toEqual([{ category: "paging" }]);
  });

  it("explicit: can carry routing detail the derivation can't infer", async () => {
    expect(
      await checksOf(`
        @surfaceDoc(
          "Surfaced as a lazy iterator named ItemPager.",
          #{ category: "paging", details: #{ name: "ItemPager" } }
        )
        op listItems(): string[];
      `),
    ).toEqual([{ category: "paging", details: { name: "ItemPager" } }]);
  });

  it("explicit: augments a derived check of the same category", async () => {
    expect(
      await checksOf(`
        @surfaceDoc(
          "Surfaced as a lazy iterator named ItemPager.",
          #{ category: "paging", details: #{ name: "ItemPager" } }
        )
        @list
        op listItems(): { @pageItems items: string[]; @nextLink next?: url };
      `),
    ).toEqual([{ category: "paging", details: { name: "ItemPager" } }]);
  });

  it("explicit: overrides a derived field of the same category", async () => {
    expect(
      await checksOf(`
        @surfaceDoc(
          "Renamed to WidgetOverride on the client surface.",
          #{ category: "naming", details: #{ name: "WidgetOverride" } }
        )
        @Azure.ClientGenerator.Core.clientName("WidgetInternal")
        model Widget {
          id: string;
        }
      `),
    ).toEqual([{ category: "naming", details: { name: "WidgetOverride", kind: "model" } }]);
  });

  it("explicit: is added alongside a derived check of a different category", async () => {
    const checks = await checksOf(`
      @surfaceDoc(
        "Renamed for clients and surfaced as a lazy iterator.",
        #{ category: "paging" }
      )
      @Azure.ClientGenerator.Core.clientName("Items")
      @list
      op listItems(): { @pageItems items: string[]; @nextLink next?: url };
    `);
    expect(checks).toContainEqual({
      category: "naming",
      details: { name: "Items", kind: "operation" },
    });
    expect(checks).toContainEqual({ category: "paging" });
  });

  // --- manifest has enough information for verification -------------------

  it("manifest: every item carries the fields a verifier needs", async () => {
    const items = await manifestItems(`
      @Azure.ClientGenerator.Core.clientName("ClientExtensibleEnum")
      @surfaceDoc("Exposed to clients as ClientExtensibleEnum.")
      enum ServerExtensibleEnum {
        value1,
        value2,
      }
    `);
    const item = items["ServerExtensibleEnum_naming"];
    expect(item.id).toBe("ServerExtensibleEnum_naming");
    expect(item.category).toBe("naming");
    expect(item.target).toBe("ServerExtensibleEnum");
    expect(item.doc).toContain("Exposed to clients");
    expect(item.details?.name).toBe("ClientExtensibleEnum");
    expect(item.details?.kind).toBe("enum");
    // A location the verifier can point back to for reporting.
    expect(typeof item.location.path).toBe("string");
    expect(item.location.start.line).toBeGreaterThanOrEqual(0);
    expect(item.location.end.line).toBeGreaterThanOrEqual(item.location.start.line);
  });

  it("manifest: groups category-specific fields under `details`", async () => {
    const items = await manifestItems(`
      interface WidgetOps {
        @Azure.ClientGenerator.Core.clientLocation("BatchClient")
        @surfaceDoc("Surfaced on BatchClient instead of WidgetOps.")
        op batchGet(): void;
      }
    `);
    const item = items["WidgetOps_batchGet_client-location"];
    expect(item.category).toBe("client-location");
    expect(item.details).toEqual({ client: "BatchClient", absentFrom: "WidgetOps" });
    // Category-specific fields live under `details`, not flattened on the item.
    expect((item as Record<string, unknown>).client).toBeUndefined();
    expect((item as Record<string, unknown>).absentFrom).toBeUndefined();
  });

  it("manifest: prose-only element becomes a single AI-routed item", async () => {
    const items = await manifestItems(`
      @surfaceDoc("The response body is surfaced as a strongly typed model.")
      op getItem(): { id: string };
    `);
    const item = items["getItem_unspecified"];
    expect(item.category).toBe("unspecified");
    expect(item.doc).toContain("strongly typed model");
    expect(item.details).toBeUndefined();
  });

  it("manifest: one item per derived check, each preserving the prose", async () => {
    const items = await manifestItems(`
      @Azure.ClientGenerator.Core.access(Azure.ClientGenerator.Core.Access.internal)
      @Azure.ClientGenerator.Core.clientName("WidgetInternal")
      @surfaceDoc("Hidden from the public surface and renamed to WidgetInternal.")
      model Widget {
        id: string;
      }
    `);
    expect(items["Widget_access"]).toMatchObject({
      category: "access",
      details: { internal: true },
    });
    expect(items["Widget_naming"].details).toEqual({ name: "WidgetInternal", kind: "model" });
    expect(items["Widget_access"].doc).toContain("Hidden from the public surface");
    expect(items["Widget_naming"].doc).toContain("Hidden from the public surface");
  });
});
