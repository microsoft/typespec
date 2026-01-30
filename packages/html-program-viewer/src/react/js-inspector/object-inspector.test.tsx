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

      const { container } = render(<ObjectInspector data={data} />);

      // Check that the Symbol property is displayed
      expect(container.textContent).toContain("Symbol(testSymbol)");
      expect(container.textContent).toContain("symbolValue");
    });

    it("should display Symbol-keyed properties without description", () => {
      const sym = Symbol();
      const data = {
        [sym]: "symbolValue",
      };

      const { container } = render(<ObjectInspector data={data} />);

      // Check that the Symbol property is displayed (even without description)
      expect(container.textContent).toContain("Symbol()");
      expect(container.textContent).toContain("symbolValue");
    });
  });
});
