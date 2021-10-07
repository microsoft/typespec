import { strictEqual } from "assert";
import { paramMessage } from "../core/library.js";

describe("cadl: library", () => {
  describe("paramMessage", () => {
    it("interpolate single param in middle", () => {
      const message = paramMessage`My name is ${"name"}.`;
      strictEqual(message({ name: "Foo" }), "My name is Foo.");
    });

    it("interpolate single param at the start", () => {
      const message = paramMessage`${"name"} is my name.`;
      strictEqual(message({ name: "Foo" }), "Foo is my name.");
    });

    it("interpolate single param at the end", () => {
      const message = paramMessage`My name: ${"name"}`;
      strictEqual(message({ name: "Foo" }), "My name: Foo");
    });

    it("interpolate multiple params", () => {
      const message = paramMessage`My name is ${"name"} and my age is ${"age"}.`;
      strictEqual(message({ name: "Foo", age: "34" }), "My name is Foo and my age is 34.");
    });
    it("interpolate multiple params next to each other", () => {
      const message = paramMessage`My username is ${"name"}${"age"}.`;
      strictEqual(message({ name: "Foo", age: "34" }), "My username is Foo34.");
    });
  });
});
