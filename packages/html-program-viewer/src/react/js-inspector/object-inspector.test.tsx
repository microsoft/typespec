import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ObjectInspector } from "./object-inspector.js";

describe("ObjectInspector", () => {
  describe("Symbol properties", () => {
    it("should display Symbol-keyed properties", () => {
      const sym = Symbol("testSymbol");
      const data = {
        stringProp: "value1",
        [sym]: "symbolValue",
      };

      const { container } = render(<ObjectInspector data={data} showNonenumerable={true} />);

      // Check that the Symbol property is displayed
      expect(container.textContent).toContain("Symbol(testSymbol)");
      expect(container.textContent).toContain("symbolValue");
    });

    it("should display Symbol-keyed properties without description", () => {
      const sym = Symbol();
      const data = {
        [sym]: "symbolValue",
      };

      const { container } = render(<ObjectInspector data={data} showNonenumerable={true} />);

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

      const { container } = render(<ObjectInspector data={data} showNonenumerable={true} />);

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

    it("should display Symbol properties with complex values", () => {
      const sym = Symbol("complexSymbol");
      const data = {
        [sym]: { nested: "value", count: 42 },
      };

      const { container } = render(<ObjectInspector data={data} showNonenumerable={true} />);

      // Check that the Symbol property is displayed
      expect(container.textContent).toContain("Symbol(complexSymbol)");
      // The complex object should be represented (exact format may vary)
      expect(container.textContent).toContain("Object");
    });
  });
});
