import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NodeIcon } from "./tree-navigation.js";

describe("NodeIcon", () => {
  it("falls back when type kind is missing", () => {
    render(
      <NodeIcon
        node={{
          kind: "type",
          id: "$.broken",
          name: "broken",
          type: { kind: undefined } as never,
          children: [],
        }}
      />,
    );

    expect(screen.getByText("?")).toBeDefined();
  });
});
