import { deepStrictEqual } from "assert";
import { OrderedMap } from "../core/util.js";

describe("compiler: util", () => {
  describe("OrderedMap", () => {
    it("contrstruct map in order", () => {
      const map = new OrderedMap([
        ["a", "pos 1"],
        ["b", "pos 2"],
        ["c", "pos 3"],
      ]);

      deepStrictEqual(
        [...map.entries()],
        [
          ["a", "pos 1"],
          ["b", "pos 2"],
          ["c", "pos 3"],
        ]
      );
    });

    describe("set() should add items at the end", () => {
      let map: OrderedMap<string, string>;
      beforeEach(() => {
        map = new OrderedMap([
          ["a", "pos 1"],
          ["b", "pos 2"],
          ["c", "pos 3"],
        ]);
        map.set("aa", "pos 4");
      });
      it("entries() return items in order", () => {
        deepStrictEqual(
          [...map.entries()],
          [
            ["a", "pos 1"],
            ["b", "pos 2"],
            ["c", "pos 3"],
            ["aa", "pos 4"],
          ]
        );
      });

      it("keys() return keys in order", () => {
        deepStrictEqual([...map.keys()], ["a", "b", "c", "aa"]);
      });

      it("values() return values in order", () => {
        deepStrictEqual([...map.values()], ["pos 1", "pos 2", "pos 3", "pos 4"]);
      });
    });

    it("keep order when renaming keys", () => {
      const map = new OrderedMap([
        ["a", "pos 1"],
        ["b", "pos 2"],
        ["c", "pos 3"],
        ["d", "pos 4"],
      ]);

      map.updateKey("b", "renamed");

      deepStrictEqual(
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
