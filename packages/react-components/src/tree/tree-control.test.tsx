import { fireEvent, render, screen } from "@testing-library/react";
import type { FC } from "react";
import { expect, it, vi } from "vitest";
import { useTreeControls } from "./tree-control.js";

const TreeControlHarness: FC<{ onSetExpanded: (expanded: Set<string>) => void }> = ({
  onSetExpanded,
}) => {
  const { expanded, expand, collapse } = useTreeControls({ onSetExpanded });
  return (
    <div>
      <button type="button" onClick={() => expand("node-1")}>
        Expand
      </button>
      <button type="button" onClick={() => collapse("node-1")}>
        Collapse
      </button>
      <span data-testid="expanded-state">{expanded.has("node-1") ? "yes" : "no"}</span>
    </div>
  );
};

it("does not notify when expanding an already expanded node", () => {
  const onSetExpanded = vi.fn();
  render(<TreeControlHarness onSetExpanded={onSetExpanded} />);

  fireEvent.click(screen.getByRole("button", { name: "Expand" }));
  expect(screen.getByTestId("expanded-state")).toHaveTextContent("yes");
  expect(onSetExpanded).toHaveBeenCalledTimes(1);
  expect(onSetExpanded.mock.calls[0]?.[0]?.has("node-1")).toBe(true);

  fireEvent.click(screen.getByRole("button", { name: "Expand" }));
  expect(screen.getByTestId("expanded-state")).toHaveTextContent("yes");
  expect(onSetExpanded).toHaveBeenCalledTimes(1);
});

it("does not notify when collapsing an already collapsed node", () => {
  const onSetExpanded = vi.fn();
  render(<TreeControlHarness onSetExpanded={onSetExpanded} />);

  fireEvent.click(screen.getByRole("button", { name: "Collapse" }));
  expect(screen.getByTestId("expanded-state")).toHaveTextContent("no");
  expect(onSetExpanded).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Expand" }));
  expect(screen.getByTestId("expanded-state")).toHaveTextContent("yes");
  expect(onSetExpanded).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole("button", { name: "Collapse" }));
  expect(screen.getByTestId("expanded-state")).toHaveTextContent("no");
  expect(onSetExpanded).toHaveBeenCalledTimes(2);

  fireEvent.click(screen.getByRole("button", { name: "Collapse" }));
  expect(screen.getByTestId("expanded-state")).toHaveTextContent("no");
  expect(onSetExpanded).toHaveBeenCalledTimes(2);
});
