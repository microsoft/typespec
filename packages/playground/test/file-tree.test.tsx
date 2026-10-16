import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { FileTreeExplorer } from "../src/react/file-tree/file-tree.js";

it("highlights collapsed folders containing changed descendants, but not unrelated files or folders", () => {
  render(
    <FileTreeExplorer
      files={["changed/nested/output.json", "changed/unchanged.json", "other/output.json"]}
      selected=""
      onSelect={vi.fn()}
      changedFiles={new Set(["changed/nested/output.json"])}
    />,
  );

  expect(screen.getByText("changed")).toHaveStyle({ fontWeight: "600" });
  expect(screen.getByText("other")).not.toHaveStyle({ fontWeight: "600" });
  expect(screen.queryByText("nested")).not.toBeInTheDocument();

  fireEvent.click(screen.getByText("changed"));
  expect(screen.getByText("nested")).toHaveStyle({ fontWeight: "600" });
  expect(screen.getByText("unchanged.json")).not.toHaveStyle({ fontWeight: "600" });

  fireEvent.click(screen.getByText("nested"));
  expect(screen.getByText("output.json")).toHaveStyle({ fontWeight: "600" });
});

it("clears folder highlighting when its descendants are no longer changed", () => {
  const props = {
    files: ["folder/output.json"],
    selected: "",
    onSelect: vi.fn(),
  };
  const { rerender } = render(
    <FileTreeExplorer {...props} changedFiles={new Set(["folder/output.json"])} />,
  );
  expect(screen.getByText("folder")).toHaveStyle({ fontWeight: "600" });

  rerender(<FileTreeExplorer {...props} changedFiles={new Set()} />);
  expect(screen.getByText("folder")).not.toHaveStyle({ fontWeight: "600" });
});
