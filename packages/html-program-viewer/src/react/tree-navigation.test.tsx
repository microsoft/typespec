import { render, screen } from "@testing-library/react";
import type { Type } from "@typespec/compiler";
import { expect, it } from "vitest";
import { NodeIcon } from "./tree-navigation.js";

it("falls back when type kind is missing", () => {
  render(
    <NodeIcon
      node={{
        kind: "type",
        id: "$.broken",
        name: "broken",
        type: { kind: undefined } as unknown as Type,
        children: [],
      }}
    />,
  );

  expect(screen.getByText("?")).toBeDefined();
});
