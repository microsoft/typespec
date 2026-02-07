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

  // Check that the Symbol property is displayed
  expect(container.textContent).toContain("Symbol(testSymbol)");
  expect(container.textContent).toContain("symbolValue");
});

it("should display Symbol-keyed properties without description", () => {
  // eslint-disable-next-line symbol-description
  const sym = Symbol();
  const data = {
    [sym]: "symbolValue",
  };

  const { container } = render(<ObjectInspector data={data} />);

  // Check that the Symbol property is displayed (even without description)
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

  // Check that all properties are displayed
  expect(container.textContent).toContain("stringProp1");
  expect(container.textContent).toContain("value1");
  expect(container.textContent).toContain("stringProp2");
  expect(container.textContent).toContain("value2");
  expect(container.textContent).toContain("Symbol(first)");
  expect(container.textContent).toContain("symbolValue1");
  expect(container.textContent).toContain("Symbol(second)");
  expect(container.textContent).toContain("symbolValue2");
});

it("should display non-enumerable Symbol properties when showNonenumerable is true", () => {
  const sym = Symbol("nonEnumSymbol");
  const data = {};
  // Define a non-enumerable Symbol property
  Object.defineProperty(data, sym, {
    value: "nonEnumValue",
    enumerable: false,
  });

  const { container } = render(<ObjectInspector data={data} showNonenumerable={true} />);

  // Check that the non-enumerable Symbol property is displayed
  expect(container.textContent).toContain("Symbol(nonEnumSymbol)");
  expect(container.textContent).toContain("nonEnumValue");
});

it("should not display non-enumerable Symbol properties when showNonenumerable is false", () => {
  const sym = Symbol("nonEnumSymbol");
  const data = {};
  // Define a non-enumerable Symbol property
  Object.defineProperty(data, sym, {
    value: "nonEnumValue",
    enumerable: false,
  });

  const { container } = render(<ObjectInspector data={data} showNonenumerable={false} />);

  // Check that the non-enumerable Symbol property is NOT displayed
  expect(container.textContent).not.toContain("Symbol(nonEnumSymbol)");
  expect(container.textContent).not.toContain("nonEnumValue");
});

it("should sort Symbol properties when sortObjectKeys is true", () => {
  const sym1 = Symbol("zebra");
  const sym2 = Symbol("apple");
  const sym3 = Symbol("middle");
  const data = {
    [sym1]: "value1",
    [sym2]: "value2",
    [sym3]: "value3",
  };

  const { container } = render(<ObjectInspector data={data} sortObjectKeys={true} />);

  const text = container.textContent || "";
  const appleIndex = text.indexOf("Symbol(apple)");
  const middleIndex = text.indexOf("Symbol(middle)");
  const zebraIndex = text.indexOf("Symbol(zebra)");

  // Symbols should be sorted alphabetically by their description
  expect(appleIndex).toBeGreaterThan(-1);
  expect(middleIndex).toBeGreaterThan(-1);
  expect(zebraIndex).toBeGreaterThan(-1);
  expect(appleIndex).toBeLessThan(middleIndex);
  expect(middleIndex).toBeLessThan(zebraIndex);
});
