import { expect, it } from "vitest";
import { formatSummary } from "../src/printer.js";
import { summarizeProgram } from "../src/summary.js";
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

it("renders summary output", async () => {
  const { program } = await Tester.compile(mainSpec);
  const summary = summarizeProgram(program);
  const output = formatSummary(summary, false);
  await expect(output).toMatchFileSnapshot("./snapshots/summary-output.txt");
});
