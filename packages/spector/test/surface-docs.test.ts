import { resolvePath } from "@typespec/compiler";
import { createTester, mockFile } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { createSurfaceChecksManifest } from "../src/coverage/surface-checks-manifest.js";
import { listSurfaceDocs, type SurfaceDoc } from "../src/lib/decorators.js";

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

async function compileSurfaceDocs(code: string): Promise<SurfaceDoc[]> {
  const { program } = await Tester.compile(code);
  return listSurfaceDocs(program);
}

describe("listSurfaceDocs derivation", () => {
  it("keeps the authored prose on the surface doc", async () => {
    const [doc] = await compileSurfaceDocs(`
      @surfaceDoc("Surfaces a lazy paged iterator on the client, not a raw response.")
      @list
      op listItems(): { @pageItems items: string[]; @nextLink next?: url };
    `);
    expect(doc.doc).toBe("Surfaces a lazy paged iterator on the client, not a raw response.");
  });

  it("derives a naming check from @clientName", async () => {
    const [doc] = await compileSurfaceDocs(`
      @Azure.ClientGenerator.Core.clientName("ClientExtensibleEnum")
      @surfaceDoc("Exposed to clients as ClientExtensibleEnum, not its service name.")
      enum ServerExtensibleEnum {
        value1,
        value2,
      }
    `);
    expect(doc.checks).toEqual([
      { category: "naming", expected: "ClientExtensibleEnum", kind: "enum" },
    ]);
  });

  it("derives an access check from @access", async () => {
    const [doc] = await compileSurfaceDocs(`
      @Azure.ClientGenerator.Core.access(Azure.ClientGenerator.Core.Access.internal)
      @surfaceDoc("Hidden from the public client surface.")
      model Widget {
        id: string;
      }
    `);
    expect(doc.checks).toEqual([{ category: "access", internal: true }]);
  });

  it("derives a hierarchy check from @hierarchyBuilding", async () => {
    const [doc] = await compileSurfaceDocs(`
      model Animal {}
      model Pet {}

      @Azure.ClientGenerator.Core.Legacy.hierarchyBuilding(Pet)
      @surfaceDoc("Dog is surfaced as a subtype of Pet, not Animal.")
      model Dog extends Animal {
        kind: string;
      }
    `);
    expect(doc.checks).toEqual([{ category: "hierarchy", expectedBase: "Pet" }]);
  });

  it("derives a paging check from the core @list decorator", async () => {
    const [doc] = await compileSurfaceDocs(`
      @surfaceDoc("Surfaces a lazy paged iterator on the client.")
      @list
      op listItems(): { @pageItems items: string[]; @nextLink next?: url };
    `);
    expect(doc.checks).toEqual([{ category: "paging" }]);
  });

  it("derives one check per client decorator when several are applied", async () => {
    const [doc] = await compileSurfaceDocs(`
      @Azure.ClientGenerator.Core.access(Azure.ClientGenerator.Core.Access.internal)
      @Azure.ClientGenerator.Core.clientName("WidgetInternal")
      @surfaceDoc("Hidden from the public surface and renamed to WidgetInternal for clients.")
      model Widget {
        id: string;
      }
    `);
    expect(doc.checks.map((c) => c.category).sort()).toEqual(["access", "naming"]);
  });

  it("derives no checks for prose with no recognized decorator (AI fallback)", async () => {
    const [doc] = await compileSurfaceDocs(`
      @surfaceDoc("The response body is surfaced as a strongly typed model.")
      op getItem(): { id: string };
    `);
    expect(doc.checks).toHaveLength(0);
  });
});

describe("surface-checks.json manifest", () => {
  let byId: Record<string, ReturnType<typeof createSurfaceChecksManifest>["items"][number]>;

  beforeEach(async () => {
    const docs = await compileSurfaceDocs(`
      @Azure.ClientGenerator.Core.clientName("ClientExtensibleEnum")
      @surfaceDoc("Exposed to clients as ClientExtensibleEnum, not its service name.")
      enum ServerExtensibleEnum {
        value1,
        value2,
      }

      model Pet {}

      @Azure.ClientGenerator.Core.Legacy.hierarchyBuilding(Pet)
      @surfaceDoc("Dog is surfaced as a subtype of Pet.")
      model Dog {
        kind: string;
      }

      @surfaceDoc("Surfaces a lazy paged iterator on the client, not a raw response.")
      @list
      op listItems(): { @pageItems items: string[]; @nextLink next?: url };
    `);
    const manifest = createSurfaceChecksManifest(".", "1.0.0", "abc123", docs);
    byId = Object.fromEntries(manifest.items.map((i) => [i.id, i]));
  });

  it("carries the authored prose on every item", () => {
    expect(byId["ServerExtensibleEnum_naming"].doc).toContain("Exposed to clients");
    expect(byId["listItems_paging"].doc).toContain("lazy paged iterator");
  });

  it("emits camelCase check fields as snake_case for verify.py", () => {
    expect(byId["Dog_hierarchy"].expected_base).toBe("Pet");
  });

  it("routes each derived check to its category", () => {
    expect(byId["listItems_paging"]).toMatchObject({ category: "paging", target: "listItems" });
    expect(byId["ServerExtensibleEnum_naming"]).toMatchObject({
      category: "naming",
      expected: "ClientExtensibleEnum",
      kind: "enum",
    });
  });
});
