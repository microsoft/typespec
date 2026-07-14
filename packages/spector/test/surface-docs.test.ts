import { resolvePath } from "@typespec/compiler";
import { createTester, expectDiagnostics } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import {
  createSurfaceChecksManifest,
  createSurfaceChecksSummary,
  type SurfaceCheckItem,
} from "../src/coverage/surface-checks-manifest.js";
import { listSurfaceDocs, type SurfaceDoc } from "../src/lib/decorators.js";

const Tester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: ["@typespec/spector"],
})
  .importLibraries()
  .using("Spector");

/** Compile `code` and return its single resolved surface doc. */
async function docOf(code: string): Promise<SurfaceDoc> {
  const { program } = await Tester.compile(code);
  const docs = listSurfaceDocs(program);
  expect(docs).toHaveLength(1);
  return docs[0];
}

/** Compile `code` and return the surface-checks items keyed by id. */
async function manifestItems(code: string): Promise<Record<string, SurfaceCheckItem>> {
  const { program } = await Tester.compile(code);
  const manifest = createSurfaceChecksManifest(".", "1.0.0", "abc123", listSurfaceDocs(program));
  return Object.fromEntries(manifest.items.map((i) => [i.id, i]));
}

describe("@surfaceDoc", () => {
  // --- authoring ----------------------------------------------------------

  it("records the explicit category, subject, expected and prose", async () => {
    const doc = await docOf(`
      enum ServerExtensibleEnum {
        value1,
        value2,
      }

      @scenario
      @scenarioDoc("Return the kind.")
      @surfaceDoc("naming", ServerExtensibleEnum, "ClientExtensibleEnum", "Exposed to clients as ClientExtensibleEnum.")
      op getKind(): ServerExtensibleEnum;
    `);
    expect(doc.category).toBe("naming");
    expect(doc.subject.kind).toBe("Enum");
    expect(doc.expected).toBe("ClientExtensibleEnum");
    expect(doc.doc).toBe("Exposed to clients as ClientExtensibleEnum.");
  });

  it("names the check from the subject, not the annotated operation", async () => {
    const doc = await docOf(`
      enum ServerExtensibleEnum {
        value1,
        value2,
      }

      @scenario
      @scenarioDoc("Return the kind.")
      @surfaceDoc("naming", ServerExtensibleEnum, "ClientExtensibleEnum")
      op getKind(): ServerExtensibleEnum;
    `);
    expect(doc.name).toBe("ServerExtensibleEnum");
  });

  it("synthesizes prose when `doc` is omitted (so the AI fallback always has one)", async () => {
    const doc = await docOf(`
      model Widget {
        id: string;
      }

      @scenario
      @scenarioDoc("Get a widget.")
      @surfaceDoc("access", Widget, "internal")
      op get(): Widget;
    `);
    expect(doc.doc).toContain("access");
    expect(doc.doc).toContain("Widget");
    expect(doc.doc).toContain("internal");
  });

  it("accepts any category string (extensible), so new categories need no core change", async () => {
    const doc = await docOf(`
      model Widget {
        id: string;
      }

      @scenario
      @scenarioDoc("Get a widget.")
      @surfaceDoc("brand-new-category", Widget, "whatever")
      op get(): Widget;
    `);
    expect(doc.category).toBe("brand-new-category");
  });

  // --- validation: must be grounded in a scenario doc ---------------------

  it("errors when applied to an element without @scenarioDoc", async () => {
    const diagnostics = await Tester.diagnose(`
      model Widget {
        id: string;
      }

      @scenario
      @surfaceDoc("access", Widget, "internal")
      op get(): Widget;
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/spector/surface-doc-requires-scenario-doc",
    });
  });

  // --- manifest: generic, category-agnostic details -----------------------

  it("derives {expected, kind} for a naming check", async () => {
    const items = await manifestItems(`
      enum ServerExtensibleEnum {
        value1,
        value2,
      }

      @scenario
      @scenarioDoc("Return the kind.")
      @surfaceDoc("naming", ServerExtensibleEnum, "ClientExtensibleEnum", "Exposed as ClientExtensibleEnum.")
      op getKind(): ServerExtensibleEnum;
    `);
    const item = items["ServerExtensibleEnum_naming"];
    expect(item.id).toBe("ServerExtensibleEnum_naming");
    expect(item.category).toBe("naming");
    expect(item.target).toBe("ServerExtensibleEnum");
    expect(item.doc).toContain("Exposed as ClientExtensibleEnum");
    expect(item.details).toEqual({ expected: "ClientExtensibleEnum", kind: "enum" });
    // A location the verifier can point back to for reporting.
    expect(typeof item.location.path).toBe("string");
    expect(item.location.start.line).toBeGreaterThanOrEqual(0);
    expect(item.location.end.line).toBeGreaterThanOrEqual(item.location.start.line);
  });

  it("derives {expected, kind, origin} for a subject inside a container", async () => {
    const items = await manifestItems(`
      model Widget {
        id: string;
      }

      @scenario
      @scenarioDoc("Get a widget.")
      @surfaceDoc("naming", Widget.id, "identifier", "Renamed to identifier.")
      op get(): Widget;
    `);
    const item = items["Widget_id_naming"];
    expect(item.category).toBe("naming");
    expect(item.target).toBe("id");
    expect(item.details).toEqual({ expected: "identifier", kind: "property", origin: "Widget" });
  });

  it("omits `expected` from details when it is blank", async () => {
    const items = await manifestItems(`
      @scenario
      @scenarioDoc("List items.")
      @surfaceDoc("paging", listItems, "")
      op listItems(): string[];
    `);
    const item = items["listItems_paging"];
    expect(item.category).toBe("paging");
    expect(item.details?.expected).toBeUndefined();
  });

  it("keeps the prose for a prose-only `other` check", async () => {
    const items = await manifestItems(`
      model Widget {
        id: string;
      }

      @scenario
      @scenarioDoc("Get a widget.")
      @surfaceDoc("other", Widget, "strongly typed", "The response body is a strongly typed model.")
      op get(): Widget;
    `);
    const item = items["Widget_other"];
    expect(item.category).toBe("other");
    expect(item.doc).toContain("strongly typed model");
  });

  // --- rendering ----------------------------------------------------------

  it("renders a single Markdown table that carries every routable field", async () => {
    const { program } = await Tester.compile(`
      model Widget {
        id: string;
      }

      @scenario
      @scenarioDoc("Get a widget.")
      @surfaceDoc("naming", Widget, "WidgetInternal", "Hidden | renamed to WidgetInternal.")
      op get(): Widget;
    `);
    const manifest = createSurfaceChecksManifest(".", "1.0.0", "abc123", listSurfaceDocs(program));
    const md = await createSurfaceChecksSummary(manifest);

    // The rendered doc is idempotent: no volatile version/commit provenance.
    expect(md).not.toContain("commit:");
    expect(md).toContain("Generated from `@surfaceDoc` annotations.");
    // Table header with the routable columns (prettier pads cell widths).
    const header = md.split("\n").find((l) => l.includes("| id"));
    expect(header).toBeDefined();
    for (const col of ["id", "scenario", "category", "target", "scope", "details", "doc"]) {
      expect(header).toContain(col);
    }
    // details encoded as key=value.
    expect(md).toContain("expected=WidgetInternal; kind=model");
    // Pipes inside prose are escaped so they don't break the table.
    expect(md).toContain("Hidden \\| renamed to WidgetInternal.");
  });

  // --- per-language exact names (scope → value dict) ----------------------

  it("expands a `scope → value` dict into one verbatim check per scope", async () => {
    const { program } = await Tester.compile(`
      model IOThing {
        id: string;
      }

      @scenario
      @scenarioDoc("Get the thing.")
      @surfaceDoc("naming", IOThing, #{ python: "io_thing", csharp: "IOThing" })
      op get(): IOThing;
    `);
    const docs = listSurfaceDocs(program);
    expect(docs).toHaveLength(2);
    const byScope = Object.fromEntries(docs.map((d) => [d.scope, d]));
    expect(byScope["python"].expected).toBe("io_thing");
    expect(byScope["csharp"].expected).toBe("IOThing");
    expect(byScope["python"].category).toBe("naming");
  });

  it("leaves scope unset for a single canonical (recast) value", async () => {
    const doc = await docOf(`
      model Widget {
        id: string;
      }

      @scenario
      @scenarioDoc("Get a widget.")
      @surfaceDoc("naming", Widget, "Widget")
      op get(): Widget;
    `);
    expect(doc.scope).toBeUndefined();
  });

  it("includes the scope in the manifest id and renders a scope column", async () => {
    const { program } = await Tester.compile(`
      model IOThing {
        id: string;
      }

      @scenario
      @scenarioDoc("Get the thing.")
      @surfaceDoc("naming", IOThing, #{ python: "io_thing" })
      op get(): IOThing;
    `);
    const manifest = createSurfaceChecksManifest(".", "1.0.0", "abc123", listSurfaceDocs(program));
    const item = manifest.items.find((i) => i.id === "IOThing_naming_python");
    expect(item).toBeDefined();
    expect(item!.scope).toBe("python");
    expect(item!.details).toEqual({ expected: "io_thing", kind: "model" });
    const md = await createSurfaceChecksSummary(manifest);
    expect(md).toContain("io_thing");
    expect(md).toContain("python");
  });

  it("records multiple @surfaceDocs on the same target (different categories)", async () => {
    const { program } = await Tester.compile(`
      model Widget {
        id: string;
      }

      @scenario
      @scenarioDoc("Get a widget.")
      @surfaceDoc("naming", Widget, "WidgetClient")
      @surfaceDoc("access", Widget, "internal")
      op get(): Widget;
    `);
    const docs = listSurfaceDocs(program);
    expect(docs).toHaveLength(2);
    expect(docs.map((d) => d.category).sort()).toEqual(["access", "naming"]);
  });
});
