import { fireEvent, render, screen } from "@testing-library/react";
import { navigateProgram, type Model, type Program } from "@typespec/compiler";
import { describe, expect, it, vi } from "vitest";
import { Tester } from "../../../test/test-host.js";
import { RevealSourceProvider } from "../reveal-source-context.js";
import { getDisplayPath, TypeOrigin } from "./type-origin.js";

async function findModel(program: Program, name: string): Promise<Model> {
  let found: Model | undefined;
  navigateProgram(program, {
    model: (model) => {
      if (model.name === name) {
        found ??= model;
      }
    },
  });
  if (found === undefined) {
    throw new Error(`Model ${name} not found`);
  }
  return found;
}

it("shows types declared in the user project as `Your code`", async () => {
  const { program } = await Tester.compile(`model Widget {}`);
  const widget = await findModel(program, "Widget");

  render(<TypeOrigin program={program} type={widget} />);

  expect(screen.getByText("Your code")).toBeDefined();
});

it("shows types declared in the compiler as `Standard library`", async () => {
  const { program } = await Tester.compile(`model Widget {}`);
  const array = await findModel(program, "Array");

  render(<TypeOrigin program={program} type={array} />);

  expect(screen.getByText("Standard library")).toBeDefined();
});

it("shows the file and line where the type is declared", async () => {
  const { program } = await Tester.compile(`
    model Widget {}
  `);
  const widget = await findModel(program, "Widget");

  render(<TypeOrigin program={program} type={widget} />);

  expect(screen.getByText("main.tsp:2")).toBeDefined();
});

it("reveals the source of a type declared in the user project", async () => {
  const { program } = await Tester.compile(`model Widget {}`);
  const widget = await findModel(program, "Widget");
  const revealSource = vi.fn();

  render(
    <RevealSourceProvider value={revealSource}>
      <TypeOrigin program={program} type={widget} />
    </RevealSourceProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: /reveal in editor/i }));

  expect(revealSource).toHaveBeenCalledWith(widget);
});

it("does not offer to reveal the source of a type declared in a library", async () => {
  const { program } = await Tester.compile(`model Widget {}`);
  const array = await findModel(program, "Array");

  render(
    <RevealSourceProvider value={() => {}}>
      <TypeOrigin program={program} type={array} />
    </RevealSourceProvider>,
  );

  expect(screen.queryByRole("button")).toBeNull();
});

describe("getDisplayPath", () => {
  it("keeps only the file name for a file outside of a package", () => {
    expect(getDisplayPath("/test/sub/main.tsp")).toEqual("main.tsp");
  });

  it("shows the path relative to the package root for a scoped package", () => {
    expect(getDisplayPath("/test/node_modules/@typespec/http/lib/main.tsp")).toEqual(
      "lib/main.tsp",
    );
  });

  it("shows the path relative to the package root for an unscoped package", () => {
    expect(getDisplayPath("/test/node_modules/mylib/lib/main.tsp")).toEqual("lib/main.tsp");
  });

  it("uses the last node_modules for nested packages", () => {
    expect(
      getDisplayPath("/test/node_modules/@scope/a/node_modules/@scope/b/lib/main.tsp"),
    ).toEqual("lib/main.tsp");
  });
});
