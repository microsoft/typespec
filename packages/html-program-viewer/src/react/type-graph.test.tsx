import { render } from "@testing-library/react";
import { it } from "vitest";
import { createViewerTestRunner } from "../../test/test-host.js";
import { TypeGraph } from "./index.js";

async function renderTypeGraphFor(code: string) {
  const runner = await createViewerTestRunner();
  await runner.compile(code);
  render(<TypeGraph program={runner.program} />);
}

it("operation", async () => {
  await renderTypeGraphFor(`op foo(): string;`);
});

it("compile unnamed union variant without error", async () => {
  await renderTypeGraphFor(`union Foo { "a", "b" }`);
});
