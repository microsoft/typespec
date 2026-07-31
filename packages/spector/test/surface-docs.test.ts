import { resolvePath } from "@typespec/compiler";
import { createTester } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import {
  createSurfaceChecksManifest,
  createSurfaceChecksSummary,
  type SurfaceCheckItem,
} from "../src/coverage/surface-checks-manifest.js";
import {
  listSurfaceDocs,
  listSurfaceDocsMissingScenarioDoc,
  type SurfaceDoc,
} from "../src/lib/decorators.js";

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
      @surfaceDoc(#{ category: "naming", expected: "ClientExtensibleEnum", doc: "Exposed to clients as ClientExtensibleEnum.", subject: "ServerExtensibleEnum" })
      op getKind(): ServerExtensibleEnum;
    `);
    expect(doc.category).toBe("naming");
    expect(doc.subject).toBe("ServerExtensibleEnum");
    expect(doc.expected).toBe("ClientExtensibleEnum");
    expect(doc.doc).toBe("Exposed to clients as ClientExtensibleEnum.");
  });

  it("resolves the scenario name from the annotated element", async () => {
    const doc = await docOf(`
      enum ServerExtensibleEnum {
        value1,
        value2,
      }

      @scenario
      @scenarioDoc("Return the kind.")
      @surfaceDoc(#{ category: "naming", expected: "ClientExtensibleEnum", subject: "ServerExtensibleEnum" })
      op getKind(): ServerExtensibleEnum;
    `);
    expect(doc.scenario).toBe("getKind");
  });

  it("synthesizes prose when `doc` is omitted (so the AI fallback always has one)", async () => {
    const doc = await docOf(`
      model Widget {
        id: string;
      }

      @scenario
      @scenarioDoc("Get a widget.")
      @surfaceDoc(#{ category: "access", expected: "internal", subject: "Widget" })
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
      @surfaceDoc(#{ category: "brand-new-category", expected: "whatever", subject: "Widget" })
      op get(): Widget;
    `);
    expect(doc.category).toBe("brand-new-category");
  });

  // --- validation: must be grounded in a scenario doc ---------------------

  it("flags a surface doc whose target has no @scenarioDoc", async () => {
    const { program } = await Tester.compile(
      `
      model Widget {
        id: string;
      }

      @scenario
      @surfaceDoc(#{ category: "access", expected: "internal", subject: "Widget" })
      op get(): Widget;
    `,
    );
    const missing = listSurfaceDocsMissingScenarioDoc(program);
    expect(missing).toHaveLength(1);
  });

  it("does not flag a surface doc whose target also has @scenarioDoc", async () => {
    const { program } = await Tester.compile(
      `
      model Widget {
        id: string;
      }

      @scenario
      @scenarioDoc("Get a widget.")
      @surfaceDoc(#{ category: "access", expected: "internal", subject: "Widget" })
      op get(): Widget;
    `,
    );
    expect(listSurfaceDocsMissingScenarioDoc(program)).toHaveLength(0);
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
      @surfaceDoc(#{ category: "naming", expected: "ClientExtensibleEnum", doc: "Exposed as ClientExtensibleEnum.", subject: "ServerExtensibleEnum" })
      op getKind(): ServerExtensibleEnum;
    `);
    const item = items["getKind_naming"];
    expect(item.id).toBe("getKind_naming");
    expect(item.category).toBe("naming");
    expect(item.target).toBe("ServerExtensibleEnum");
    expect(item.doc).toContain("Exposed as ClientExtensibleEnum");
    expect(item.details).toEqual({ expected: "ClientExtensibleEnum" });
    // A location the verifier can point back to for reporting.
    expect(typeof item.location.path).toBe("string");
    expect(item.location.start.line).toBeGreaterThanOrEqual(0);
    expect(item.location.end.line).toBeGreaterThanOrEqual(item.location.start.line);
  });

  it("derives {expected} for a subject inside a container", async () => {
    const items = await manifestItems(`
      model Widget {
        id: string;
      }

      @scenario
      @scenarioDoc("Get a widget.")
      @surfaceDoc(#{ category: "naming", expected: "identifier", doc: "Renamed to identifier.", subject: "Widget.id" })
      op get(): Widget;
    `);
    const item = items["get_naming"];
    expect(item.category).toBe("naming");
    expect(item.target).toBe("Widget.id");
    expect(item.details).toEqual({ expected: "identifier" });
  });

  it("omits `expected` from details when it is blank", async () => {
    const items = await manifestItems(`
      @scenario
      @scenarioDoc("List items.")
      @surfaceDoc(#{ category: "paging", expected: "", subject: "listItems" })
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
      @surfaceDoc(#{ category: "other", expected: "strongly typed", doc: "The response body is a strongly typed model.", subject: "Widget" })
      op get(): Widget;
    `);
    const item = items["get_other"];
    expect(item.category).toBe("other");
    expect(item.doc).toContain("strongly typed model");
  });

  // --- rendering ----------------------------------------------------------

  it("renders a JSON checks doc that carries every routable field", async () => {
    const { program } = await Tester.compile(
      `
      model Widget {
        id: string;
      }

      @scenario
      @scenarioDoc("Get a widget.")
      @surfaceDoc(#{ category: "naming", expected: "WidgetInternal", doc: "Hidden | renamed to WidgetInternal.", subject: "Widget" })
      op get(): Widget;
    `,
    );
    const manifest = createSurfaceChecksManifest(".", "1.0.0", "abc123", listSurfaceDocs(program));
    const json = createSurfaceChecksSummary(manifest);
    const data = JSON.parse(json);

    // The rendered doc is idempotent: no volatile version/commit provenance.
    expect(json).not.toContain("commit:");
    // Structured items with all routable fields.
    expect(data.items).toHaveLength(1);
    const item = data.items[0];
    expect(item).toMatchObject({
      category: "naming",
      target: "Widget",
      details: { expected: "WidgetInternal" },
      doc: "Hidden | renamed to WidgetInternal.",
    });
    expect(item.id).toBeDefined();
    expect(item.scenario).toBeDefined();
  });

  // --- per-language exact names (scope → value dict) ----------------------

  it("expands a `scope → value` dict into one verbatim check per scope", async () => {
    const { program } = await Tester.compile(
      `
      model IOThing {
        id: string;
      }

      @scenario
      @scenarioDoc("Get the thing.")
      @surfaceDoc(#{ category: "naming", expected: #{ python: "io_thing", csharp: "IOThing" }, subject: "IOThing" })
      op get(): IOThing;
    `,
    );
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
      @surfaceDoc(#{ category: "naming", expected: "Widget", subject: "Widget" })
      op get(): Widget;
    `);
    expect(doc.scope).toBeUndefined();
  });

  it("includes the scope in the manifest id and renders a scope column", async () => {
    const { program } = await Tester.compile(
      `
      model IOThing {
        id: string;
      }

      @scenario
      @scenarioDoc("Get the thing.")
      @surfaceDoc(#{ category: "naming", expected: #{ python: "io_thing" }, subject: "IOThing" })
      op get(): IOThing;
    `,
    );
    const manifest = createSurfaceChecksManifest(".", "1.0.0", "abc123", listSurfaceDocs(program));
    const item = manifest.items.find((i) => i.id === "get_naming_python");
    expect(item).toBeDefined();
    expect(item!.scope).toBe("python");
    expect(item!.details).toEqual({ expected: "io_thing" });
    const md = await createSurfaceChecksSummary(manifest);
    expect(md).toContain("io_thing");
    expect(md).toContain("python");
  });
});
