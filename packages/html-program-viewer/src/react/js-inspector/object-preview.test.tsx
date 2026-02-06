import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { ObjectPreview } from "./object-preview.js";

it("should display Symbol properties in object preview", () => {
  const sym = Symbol("testSymbol");
  const data = {
    stringProp: "value1",
    [sym]: "symbolValue",
  };

  const { container } = render(<ObjectPreview data={data} />);

  // Check that both string and Symbol properties are displayed in preview
  expect(container.textContent).toContain("stringProp");
  expect(container.textContent).toContain("value1");
  expect(container.textContent).toContain("Symbol(testSymbol)");
  expect(container.textContent).toContain("symbolValue");
});

it("should display Symbol properties without description in preview", () => {
  // eslint-disable-next-line symbol-description
  const sym = Symbol();
  const data = {
    [sym]: "value",
  };

  const { container } = render(<ObjectPreview data={data} />);

  expect(container.textContent).toContain("Symbol()");
  expect(container.textContent).toContain("value");
});

it("should respect max properties limit including Symbol properties", () => {
  const sym1 = Symbol("first");
  const sym2 = Symbol("second");
  const data = {
    prop1: "val1",
    prop2: "val2",
    prop3: "val3",
    prop4: "val4",
    [sym1]: "symVal1",
    [sym2]: "symVal2",
  };

  const { container } = render(<ObjectPreview data={data} />);

  // Should show ellipsis when exceeding max properties (5)
  expect(container.textContent).toContain("…");
});
