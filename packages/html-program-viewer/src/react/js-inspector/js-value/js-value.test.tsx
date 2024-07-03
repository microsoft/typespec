import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JsValue } from "./js-value.js";

describe("render values", () => {
  it.each([
    [undefined, "undefined"],
    [null, "null"],
    [123, "123"],
    [123.456, "123.456"],
    [123n, "123n"],
    ["abc", `"abc"`],
    [true, "true"],

    [/[a-z]+/, "/[a-z]+/"],
    [
      new Date("2022-04-01T01:02:32Z"),
      "Fri Apr 01 2022 01:02:32 GMT+0000 (Coordinated Universal Time)",
    ],
    [{}, "Object"],
    [{ name: "abc" }, "Object"],
    [[1, 2], "Array(2)"],
    [Symbol("abc"), "Symbol(abc)"],
  ])("render %s as '%s'", (value, expected) => {
    const { container } = render(<JsValue value={value} />);
    expect(container).toHaveTextContent(expected);
  });
});
