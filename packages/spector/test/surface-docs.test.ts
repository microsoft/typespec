import { resolvePath } from "@typespec/compiler";
import { createTester } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { createSurfaceChecksManifest } from "../src/coverage/surface-checks-manifest.js";
import { listSurfaceDocs } from "../src/lib/decorators.js";

const Tester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: ["@typespec/spector"],
})
  .importLibraries()
  .using("Spector");

const code = `
  @surfaceDoc(#[
    #{
      category: "naming",
      doc: "Exposed to clients as \`ClientExtensibleEnum\`.",
      expected: "ClientExtensibleEnum",
      kind: "enum",
    }
  ])
  enum ServerExtensibleEnum {
    value1,
    value2,
  }

  @surfaceDoc(#[
    #{ category: "access", doc: "Hidden from the public client surface.", internal: true },
    #{
      category: "naming",
      doc: "Renamed to \`WidgetInternal\` on the client surface.",
      expected: "WidgetInternal",
      kind: "model",
    }
  ])
  model Widget {
    id: string;
  }

  @surfaceDoc(#[
    #{ category: "hierarchy", doc: "Dog is surfaced as a subtype of Pet.", expectedBase: "Pet" }
  ])
  model Dog {
    kind: string;
  }
`;

describe("@surfaceDoc / listSurfaceDocs", () => {
  it("collects every annotation, including multiple checks on one element", async () => {
    const { program } = await Tester.compile(code);
    const docs = listSurfaceDocs(program);

    expect(docs.map((d) => d.name)).toEqual(["Dog", "ServerExtensibleEnum", "Widget"]);
    const widget = docs.find((d) => d.name === "Widget")!;
    expect(widget.checks).toHaveLength(2);
    expect(widget.checks.map((c) => c.category)).toEqual(["access", "naming"]);
  });

  it("builds a language-neutral manifest with verify.py-compatible fields", async () => {
    const { program } = await Tester.compile(code);
    const manifest = createSurfaceChecksManifest(".", "1.0.0", "abc123", listSurfaceDocs(program));

    expect(manifest.version).toBe("1.0.0");
    expect(manifest.commit).toBe("abc123");
    expect(manifest.items.map((i) => i.id)).toEqual([
      "Dog_hierarchy",
      "ServerExtensibleEnum_naming",
      "Widget_access",
      "Widget_naming",
    ]);

    const byId = Object.fromEntries(manifest.items.map((i) => [i.id, i]));
    expect(byId["ServerExtensibleEnum_naming"]).toMatchObject({
      category: "naming",
      target: "ServerExtensibleEnum",
      expected: "ClientExtensibleEnum",
      kind: "enum",
    });
    // camelCase decorator fields are emitted snake_case for verify.py.
    expect(byId["Dog_hierarchy"].expected_base).toBe("Pet");
    expect(byId["Widget_access"].internal).toBe(true);
  });
});
