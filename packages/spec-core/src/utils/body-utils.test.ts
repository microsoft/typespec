import { cleanupBody } from "./body-utils.js";

describe("BodyUtils", () => {
  describe("cleanupBody()", () => {
    it("remove trailing whitespaces", () => {
      expect(cleanupBody("  foo     ")).toEqual("foo");
    });

    it("remove trailing new lines", () => {
      expect(cleanupBody("\nfoo\nbar\n")).toEqual("foo\nbar");
    });

    it("replace windows line endings", () => {
      expect(cleanupBody("foo\r\nbar")).toEqual("foo\nbar");
    });
  });
});
