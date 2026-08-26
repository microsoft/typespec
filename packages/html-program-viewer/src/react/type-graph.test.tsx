import { render } from "@testing-library/react";
import { it } from "vitest";
import { Tester } from "../../test/test-host.js";
import { TypeGraph } from "./index.js";

async function renderTypeGraphFor(code: string) {
  const { program } = await Tester.compile(code);
  render(<TypeGraph program={program} />);
}

it("operation", async () => {
  await renderTypeGraphFor(`op foo(): string;`);
});

it("compile unnamed union variant without error", async () => {
  await renderTypeGraphFor(`union Foo { "a", "b" }`);
});
