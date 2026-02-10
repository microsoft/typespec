import { describe, expect, it } from "vitest";
import { formatTypeView } from "../src/printer.js";
import { getTypeViewJson } from "../src/type-view-json.js";
import { Tester } from "./tester.js";

const mainSpec = `
@service(#{title: "Widget Service"})
namespace Widget {
  @doc("Widget model")
  model Widget {
    id: string;
    name?: string;
  }

  @doc("Widget enum")
  enum Kind {
    One,
    Two,
  }

  union Choice {
    one: string,
    two: int32,
  }

  scalar WidgetId extends string;

  interface WidgetOps {
    op listWidgets(): Widget[];
  }
}

op globalOp(): void;
`;

function stripLocations(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(stripLocations);
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (key === "location") continue;
      result[key] = stripLocations(value);
    }
    return result;
  }
  return obj;
}

describe("view json", () => {
  it("renders model at depth 0", async () => {
    const { program } = await Tester.compile(mainSpec);
    const widgetNs = program.getGlobalNamespaceType().namespaces.get("Widget")!;
    const widgetModel = widgetNs.models.get("Widget")!;
    const json = getTypeViewJson(program, widgetModel, { depth: 0, cwd: "/" });
    const output = JSON.stringify(stripLocations(json), null, 2);
    await expect(output).toMatchFileSnapshot("./snapshots/view-model-depth0.json");
  });

  it("renders model at depth 1", async () => {
    const { program } = await Tester.compile(mainSpec);
    const widgetNs = program.getGlobalNamespaceType().namespaces.get("Widget")!;
    const widgetModel = widgetNs.models.get("Widget")!;
    const json = getTypeViewJson(program, widgetModel, { depth: 1, cwd: "/" });
    const output = JSON.stringify(stripLocations(json), null, 2);
    await expect(output).toMatchFileSnapshot("./snapshots/view-model-depth1.json");
  });

  it("renders model at depth 2", async () => {
    const { program } = await Tester.compile(mainSpec);
    const widgetNs = program.getGlobalNamespaceType().namespaces.get("Widget")!;
    const widgetModel = widgetNs.models.get("Widget")!;
    const json = getTypeViewJson(program, widgetModel, { depth: 2, cwd: "/" });
    const output = JSON.stringify(stripLocations(json), null, 2);
    await expect(output).toMatchFileSnapshot("./snapshots/view-model-depth2.json");
  });

  it("renders enum at depth 1", async () => {
    const { program } = await Tester.compile(mainSpec);
    const widgetNs = program.getGlobalNamespaceType().namespaces.get("Widget")!;
    const kindEnum = widgetNs.enums.get("Kind")!;
    const json = getTypeViewJson(program, kindEnum, { depth: 1, cwd: "/" });
    const output = JSON.stringify(stripLocations(json), null, 2);
    await expect(output).toMatchFileSnapshot("./snapshots/view-enum-depth1.json");
  });

  it("renders namespace at depth 1", async () => {
    const { program } = await Tester.compile(mainSpec);
    const widgetNs = program.getGlobalNamespaceType().namespaces.get("Widget")!;
    const json = getTypeViewJson(program, widgetNs, { depth: 1, cwd: "/" });
    const output = JSON.stringify(stripLocations(json), null, 2);
    await expect(output).toMatchFileSnapshot("./snapshots/view-namespace-depth1.json");
  });
});

function stripLocationLine(text: string): string {
  return text.replace(/Location: .*/, "Location: <stripped>");
}

describe("view text", () => {
  it("renders model as text", async () => {
    const { program } = await Tester.compile(mainSpec);
    const widgetNs = program.getGlobalNamespaceType().namespaces.get("Widget")!;
    const widgetModel = widgetNs.models.get("Widget")!;
    const output = stripLocationLine(formatTypeView(program, widgetModel, false));
    await expect(output).toMatchFileSnapshot("./snapshots/view-model-text.txt");
  });

  it("renders enum as text", async () => {
    const { program } = await Tester.compile(mainSpec);
    const widgetNs = program.getGlobalNamespaceType().namespaces.get("Widget")!;
    const kindEnum = widgetNs.enums.get("Kind")!;
    const output = stripLocationLine(formatTypeView(program, kindEnum, false));
    await expect(output).toMatchFileSnapshot("./snapshots/view-enum-text.txt");
  });

  it("renders namespace as text", async () => {
    const { program } = await Tester.compile(mainSpec);
    const widgetNs = program.getGlobalNamespaceType().namespaces.get("Widget")!;
    const output = stripLocationLine(formatTypeView(program, widgetNs, false));
    await expect(output).toMatchFileSnapshot("./snapshots/view-namespace-text.txt");
  });
});
