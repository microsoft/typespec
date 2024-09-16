import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
    </SplitPane>,
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
    </SplitPane>,
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
      </SplitPane>,
    );

    expect(await screen.findByText("Pane 1")).toHaveStyle({ width: "500px" });
    expect(await screen.findByText("Pane 2")).toHaveStyle({ width: "500px" });
  });

  it("undefined pane sizes take the remaining width", async () => {
    render(
      <SplitPane initialSizes={["200px", "100px", undefined]}>
        <Pane>Pane 1</Pane>
        <Pane>Pane 2</Pane>
        <Pane>Pane 3</Pane>
      </SplitPane>,
    );

    expect(await screen.findByText("Pane 1")).toHaveStyle({ width: "200px" });
    expect(await screen.findByText("Pane 2")).toHaveStyle({ width: "100px" });
    expect(await screen.findByText("Pane 3")).toHaveStyle({ width: "700px" });
  });

  function mockMouseEvent(
    target: HTMLElement,
    type: keyof typeof createEvent,
    { pageX, pageY }: { pageX?: number; pageY?: number } = {},
  ) {
    const evt = createEvent[type](target);
    if (pageX !== undefined) (evt as any).pageX = pageX;
    if (pageY !== undefined) (evt as any).pageY = pageY;
    return evt;
  }

  it("resize", async () => {
    render(
      <SplitPane initialSizes={[undefined, undefined]}>
        <Pane>Pane 1</Pane>
        <Pane>Pane 2</Pane>
      </SplitPane>,
    );
    const separator = await screen.getByRole("separator");
    const pane1 = await screen.findByText("Pane 1");
    const pane2 = await screen.findByText("Pane 2");

    expect(pane1).toHaveStyle({ width: "500px" });
    expect(pane2).toHaveStyle({ width: "500px" });

    fireEvent(separator, mockMouseEvent(separator, "mouseDown", { pageX: 500, pageY: 0 }));
    fireEvent(separator, mockMouseEvent(separator, "mouseMove", { pageX: 600, pageY: 0 }));

    expect(pane1).toHaveStyle({ width: "600px" });
    expect(pane2).toHaveStyle({ width: "400px" });

    fireEvent(separator, mockMouseEvent(separator, "mouseUp"));
    fireEvent(separator, mockMouseEvent(separator, "mouseMove", { pageX: 700, pageY: 0 }));

    // Should not update after we mouse up
    expect(pane1).toHaveStyle({ width: "600px" });
    expect(pane2).toHaveStyle({ width: "400px" });
  });
});
