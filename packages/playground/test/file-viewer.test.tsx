import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { expect, it, vi } from "vitest";
import type { OutputViewerProps } from "../src/react/types.js";

vi.mock("../src/react/typespec-editor.js", () => ({
  OutputEditor: ({ value }: { value: string }) =>
    createElement("pre", { "data-testid": "output" }, value),
}));

import { createFileViewer } from "../src/react/output-view/file-viewer.js";

const outputFiles = ["a.yaml", "b.yaml"];
const viewer = createFileViewer([]);

function createProgram(files: Record<string, string>, failing: { current: boolean }) {
  return {
    host: {
      readFile: vi.fn(async (path: string) => {
        if (failing.current) {
          throw new Error(`File ${path} not found.`);
        }
        const name = path.slice("./tsp-output/".length);
        const text = files[name];
        if (text === undefined) {
          throw new Error(`File ${path} not found.`);
        }
        return { text };
      }),
    },
  } as OutputViewerProps["program"];
}

function renderOutput(
  program: OutputViewerProps["program"],
  outputFileContents: ReadonlyMap<string, string>,
) {
  return (
    <FluentProvider theme={webLightTheme}>
      {viewer.render({ program, outputFiles, outputFileContents })}
    </FluentProvider>
  );
}

it("shows the latest snapshot for a file that was not open during the last successful compile", async () => {
  const files = { "a.yaml": "a1", "b.yaml": "b1" };
  const failing = { current: false };
  const program = createProgram(files, failing);
  const view = render(renderOutput(program, new Map(Object.entries(files))));

  await waitFor(() => expect(screen.getByTestId("output")).toHaveTextContent("a1"));
  fireEvent.click(screen.getByRole("tab", { name: "b.yaml" }));
  await waitFor(() => expect(screen.getByTestId("output")).toHaveTextContent("b1"));
  fireEvent.click(screen.getByRole("tab", { name: "a.yaml" }));
  await waitFor(() => expect(screen.getByTestId("output")).toHaveTextContent("a1"));

  files["b.yaml"] = "b2";
  view.rerender(renderOutput(program, new Map(Object.entries(files))));
  await waitFor(() => expect(screen.getByTestId("output")).toHaveTextContent("a1"));

  failing.current = true;
  view.rerender(renderOutput(program, new Map(Object.entries(files))));
  fireEvent.click(screen.getByRole("tab", { name: "b.yaml" }));

  await waitFor(() => expect(screen.getByTestId("output")).toHaveTextContent("b2"));
});

it("shows snapshot text for an emitted file that was never opened", async () => {
  const files = { "a.yaml": "a1", "b.yaml": "never-opened" };
  const failing = { current: false };
  const program = createProgram(files, failing);
  const view = render(renderOutput(program, new Map(Object.entries(files))));

  await waitFor(() => expect(screen.getByTestId("output")).toHaveTextContent("a1"));

  failing.current = true;
  view.rerender(renderOutput(program, new Map(Object.entries(files))));
  fireEvent.click(screen.getByRole("tab", { name: "b.yaml" }));

  await waitFor(() => expect(screen.getByTestId("output")).toHaveTextContent("never-opened"));
});

it("prefers text still on disk over the snapshot", async () => {
  const files = { "a.yaml": "a1", "b.yaml": "from-disk" };
  const failing = { current: false };
  const program = createProgram(files, failing);
  render(
    renderOutput(
      program,
      new Map([
        ["a.yaml", "a1"],
        ["b.yaml", "from-snapshot"],
      ]),
    ),
  );

  await waitFor(() => expect(screen.getByTestId("output")).toHaveTextContent("a1"));
  fireEvent.click(screen.getByRole("tab", { name: "b.yaml" }));

  await waitFor(() => expect(screen.getByTestId("output")).toHaveTextContent("from-disk"));
});
