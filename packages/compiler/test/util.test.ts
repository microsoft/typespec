import { strictEqual } from "assert";
import { OrderedMap } from "../core/util.js";

describe("compiler: util", () => {
  describe("OrderedMap", () => {
    it("contrstruct map in order", () => {
      const map = new OrderedMap([
        ["a", "pos 1"],
        ["b", "pos 2"],
        ["c", "pos 3"],
      ]);

      strictEqual(
        [...map.entries()],
        [
          ["a", "pos 1"],
          ["b", "pos 2"],
          ["c", "pos 3"],
        ]
      );
    });

    it("add new items at the end", () => {
      const map = new OrderedMap([
        ["a", "pos 1"],
        ["b", "pos 2"],
        ["c", "pos 3"],
      ]);

      map.set("aa", "pos 4");
      strictEqual(
        [...map.entries()],
        [
          ["a", "pos 1"],
          ["b", "pos 2"],
          ["c", "pos 3"],
          ["aa", "pos 4"],
        ]
      );
    });

    it("keep order when renaming keys", () => {
      const map = new OrderedMap([
        ["a", "pos 1"],
        ["b", "pos 2"],
        ["c", "pos 3"],
        ["d", "pos 4"],
      ]);

      map.updateKey("b", "renamed");

      strictEqual(
        [...map.entries()],
        [
          ["a", "pos 1"],
          ["renamed", "pos 2"],
          ["c", "pos 3"],
          ["d", "pos 4"],
        ]
      );
    });
  });
});
