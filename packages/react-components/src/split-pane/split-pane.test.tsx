import { render, screen } from "@testing-library/react";
import { describe } from "node:test";
import { expect, it, vi } from "vitest";
import { Pane } from "./pane.js";
import { SplitPane } from "./split-pane.js";

vi.mock("./use-el-dimensions.js", () => ({
  useElDimensions: () => ({ width: 1000, height: 1000 }),
}));

it("render 2 panes", async () => {
  const { container } = render(
    <SplitPane sizes={[undefined, undefined]}>
      <Pane>Pane 1</Pane>
      <Pane>Pane 2</Pane>
    </SplitPane>
  );
  expect(await screen.findAllByRole("separator")).toHaveLength(1);
  expect(container).toHaveTextContent("Pane 1");
  expect(container).toHaveTextContent("Pane 2");
});

it("render 3 panes with 2 separators", async () => {
  const { container } = render(
    <SplitPane sizes={[undefined, undefined, undefined]}>
      <Pane>Pane 1</Pane>
      <Pane>Pane 2</Pane>
      <Pane>Pane 3</Pane>
    </SplitPane>
  );
  expect(await screen.findAllByRole("separator")).toHaveLength(2);
  expect(container).toHaveTextContent("Pane 1");
  expect(container).toHaveTextContent("Pane 2");
  expect(container).toHaveTextContent("Pane 3");
});

describe("sizes", () => {
  it("split equally when initial sizes are undefined", async () => {
    render(
      <SplitPane initialSizes={[undefined, undefined]}>
        <Pane>Pane 1</Pane>
        <Pane>Pane 2</Pane>
      </SplitPane>
    );
    screen.debug();

    expect(await screen.findByText("Pane 1")).toHaveStyle({ width: "500px" });
    expect(await screen.findByText("Pane 2")).toHaveStyle({ width: "500px" });
  });

  it("undefined pane sizes take the remaining width", async () => {
    render(
      <SplitPane initialSizes={["200px", "100px", undefined]}>
        <Pane>Pane 1</Pane>
        <Pane>Pane 2</Pane>
        <Pane>Pane 3</Pane>
      </SplitPane>
    );
    screen.debug();

    expect(await screen.findByText("Pane 1")).toHaveStyle({ width: "200px" });
    expect(await screen.findByText("Pane 2")).toHaveStyle({ width: "100px" });
    expect(await screen.findByText("Pane 3")).toHaveStyle({ width: "700px" });
  });
});
