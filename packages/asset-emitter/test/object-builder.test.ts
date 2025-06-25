import { beforeEach, describe, expect, it } from "vitest";
import { ObjectBuilder } from "../src/index.js";
import { Placeholder } from "../src/placeholder.js";

describe("ObjectBuilder", () => {
  it("create simple builder", () => {
    const builder = new ObjectBuilder({
      foo: "bar",
    });
    expect(builder.foo).toBe("bar");
  });

  it("create adds elements to builder", () => {
    const builder = new ObjectBuilder({
      foo: "bar",
    });
    builder.set("bar", "baz");
    expect(builder.foo).toBe("bar");
    expect(builder.bar).toBe("baz");
  });

  describe("when working with placeholders", () => {
    let placeholder: Placeholder<any>;

    beforeEach(() => {
      placeholder = new Placeholder();
    });

    it("has no values to start with", () => {
      const builder = new ObjectBuilder(placeholder);
      expect(builder.foo).toBeUndefined();
    });

    it("resolve values from placeholder", () => {
      const builder = new ObjectBuilder(placeholder);
      expect(builder.foo).toBeUndefined();
      placeholder.setValue({ foo: "bar" });
      expect(builder.foo).toBe("bar");
    });

    it("create object builder from another object builder with a placeholder", () => {
      const builder1 = new ObjectBuilder(placeholder);
      const builder2 = new ObjectBuilder(builder1);
      placeholder.setValue({ foo: "bar" });
      expect(builder2.foo).toBe("bar");
    });
  });
});
