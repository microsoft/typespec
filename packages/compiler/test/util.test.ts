import { deepStrictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { RekeyableMap } from "../src/core/index.js";
import { createRekeyableMap } from "../src/utils/misc.js";

describe("compiler: util", () => {
  describe("RekeyableMap", () => {
    it("construct map in order", () => {
      const map = createRekeyableMap([
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
        ],
      );
    });

    describe("set() should add items at the end", () => {
      let map: RekeyableMap<string, string>;
      beforeEach(() => {
        map = createRekeyableMap([
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
          ],
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
      const map = createRekeyableMap([
        ["a", "pos 1"],
        ["b", "pos 2"],
        ["c", "pos 3"],
        ["d", "pos 4"],
      ]);

      map.rekey("b", "renamed");

      deepStrictEqual(
        [...map.entries()],
        [
          ["a", "pos 1"],
          ["renamed", "pos 2"],
          ["c", "pos 3"],
          ["d", "pos 4"],
        ],
      );
    });

    it("rekeying to existing key override the target", () => {
      const map = createRekeyableMap([
        ["a", "pos 1"],
        ["b", "pos 2"],
        ["c", "pos 3"],
        ["d", "pos 4"],
      ]);

      map.rekey("c", "b");

      deepStrictEqual(
        [...map.entries()],
        [
          ["a", "pos 1"],
          ["b", "pos 3"],
          ["d", "pos 4"],
        ],
      );
    });
  });
});
