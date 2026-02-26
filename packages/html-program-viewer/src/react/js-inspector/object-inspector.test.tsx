import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { ObjectInspector } from "./object-inspector.js";

it("should display Symbol-keyed properties", () => {
  const sym = Symbol("testSymbol");
  const data = {
    stringProp: "value1",
    [sym]: "symbolValue",
  };

  const { container } = render(<ObjectInspector data={data} />);

  expect(container.textContent).toContain("Symbol(testSymbol)");
  expect(container.textContent).toContain("symbolValue");
});

it("should display Symbol-keyed properties without description", () => {
  const sym = Symbol();
  const data = {
    [sym]: "symbolValue",
  };

  const { container } = render(<ObjectInspector data={data} />);

  expect(container.textContent).toContain("Symbol()");
  expect(container.textContent).toContain("symbolValue");
});

it("should display both string and Symbol properties", () => {
  const sym1 = Symbol("first");
  const sym2 = Symbol("second");
  const data = {
    stringProp1: "value1",
    stringProp2: "value2",
    [sym1]: "symbolValue1",
    [sym2]: "symbolValue2",
  };

  const { container } = render(<ObjectInspector data={data} />);

  expect(container.textContent).toContain("stringProp1");
  expect(container.textContent).toContain("value1");
  expect(container.textContent).toContain("stringProp2");
  expect(container.textContent).toContain("value2");
  expect(container.textContent).toContain("Symbol(first)");
  expect(container.textContent).toContain("symbolValue1");
  expect(container.textContent).toContain("Symbol(second)");
  expect(container.textContent).toContain("symbolValue2");
});

it("should not display non-enumerable Symbol properties when showNonenumerable is false", () => {
  const sym = Symbol("nonEnumSymbol");
  const data = {};
  Object.defineProperty(data, sym, {
    value: "nonEnumValue",
    enumerable: false,
  });

  const { container } = render(<ObjectInspector data={data} showNonenumerable={false} />);

  expect(container.textContent).not.toContain("Symbol(nonEnumSymbol)");
  expect(container.textContent).not.toContain("nonEnumValue");
});
