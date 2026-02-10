import { createTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { formatSummary } from "../src/printer.js";
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

describe("summary", () => {
  it("renders summary output", async () => {
    await runner.compile(mainSpec);
    const summary = summarizeProgram(runner.program);
    const output = formatSummary(summary, false);
    await expect(output).toMatchFileSnapshot("./snapshots/summary-output.txt");
  });
});
