import { createTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { formatSummary, getTypeViewJson } from "../src/printer.js";
import { summarizeProgram } from "../src/summary.js";

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

let runner: Awaited<ReturnType<typeof createTestRunner>>;

beforeEach(async () => {
  runner = await createTestRunner();
});

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

describe("summary", () => {
  it("renders summary output", async () => {
    await runner.compile(mainSpec);
    const summary = summarizeProgram(runner.program);
    const output = formatSummary(summary, false);
    await expect(output).toMatchFileSnapshot("./snapshots/summary-output.txt");
  });
});

describe("view json", () => {
  it("renders model at depth 0", async () => {
    await runner.compile(mainSpec);
    const widgetNs = runner.program.getGlobalNamespaceType().namespaces.get("Widget")!;
    const widgetModel = widgetNs.models.get("Widget")!;
    const json = getTypeViewJson(runner.program, widgetModel, { depth: 0, cwd: "/" });
    const output = JSON.stringify(stripLocations(json), null, 2);
    await expect(output).toMatchFileSnapshot("./snapshots/view-model-depth0.json");
  });

  it("renders model at depth 1", async () => {
    await runner.compile(mainSpec);
    const widgetNs = runner.program.getGlobalNamespaceType().namespaces.get("Widget")!;
    const widgetModel = widgetNs.models.get("Widget")!;
    const json = getTypeViewJson(runner.program, widgetModel, { depth: 1, cwd: "/" });
    const output = JSON.stringify(stripLocations(json), null, 2);
    await expect(output).toMatchFileSnapshot("./snapshots/view-model-depth1.json");
  });

  it("renders model at depth 2", async () => {
    await runner.compile(mainSpec);
    const widgetNs = runner.program.getGlobalNamespaceType().namespaces.get("Widget")!;
    const widgetModel = widgetNs.models.get("Widget")!;
    const json = getTypeViewJson(runner.program, widgetModel, { depth: 2, cwd: "/" });
    const output = JSON.stringify(stripLocations(json), null, 2);
    await expect(output).toMatchFileSnapshot("./snapshots/view-model-depth2.json");
  });

  it("renders enum at depth 1", async () => {
    await runner.compile(mainSpec);
    const widgetNs = runner.program.getGlobalNamespaceType().namespaces.get("Widget")!;
    const kindEnum = widgetNs.enums.get("Kind")!;
    const json = getTypeViewJson(runner.program, kindEnum, { depth: 1, cwd: "/" });
    const output = JSON.stringify(stripLocations(json), null, 2);
    await expect(output).toMatchFileSnapshot("./snapshots/view-enum-depth1.json");
  });

  it("renders namespace at depth 1", async () => {
    await runner.compile(mainSpec);
    const widgetNs = runner.program.getGlobalNamespaceType().namespaces.get("Widget")!;
    const json = getTypeViewJson(runner.program, widgetNs, { depth: 1, cwd: "/" });
    const output = JSON.stringify(stripLocations(json), null, 2);
    await expect(output).toMatchFileSnapshot("./snapshots/view-namespace-depth1.json");
  });
});
