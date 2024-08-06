import { expect } from "chai";
import "mocha";
import { RequestExt } from "../src/types.js";
import { RequestExpectation } from "../src/expectation.js";

describe("expectation test suite", () => {
  describe("containsQueryParam()", () => {
    it("should validate successfully with correct input of multi collection", () => {
      const requestExt = { query: { letter: ["a", "b", "c"] } } as unknown as RequestExt;
      const requestExpectation = new RequestExpectation(requestExt);
      expect(requestExpectation.containsQueryParam("letter", ["a", "b", "c"], "multi")).to.equal(undefined);
    });

    it("should validate successfully with correct input of csv collection with common not encoded", () => {
      const requestExt = { query: { letter: "a,b,c" } } as unknown as RequestExt;
      const requestExpectation = new RequestExpectation(requestExt);
      expect(requestExpectation.containsQueryParam("letter", ["a", "b", "c"], "csv")).to.equal(undefined);
    });

    it("should validate successfully with correct input of csv collection with common encoded", () => {
      const requestExt = { query: { letter: "a%2Cb%2Cc" } } as unknown as RequestExt;
      const requestExpectation = new RequestExpectation(requestExt);
      expect(requestExpectation.containsQueryParam("letter", ["a", "b", "c"], "csv")).to.equal(undefined);
    });

    it("should validate successfully with correct input of csv collection with common encoded and space", () => {
      const requestExt = { query: { letter: "a%2Cb%2Cc%20" } } as unknown as RequestExt;
      const requestExpectation = new RequestExpectation(requestExt);
      expect(requestExpectation.containsQueryParam("letter", ["a", "b", "c "], "csv")).to.equal(undefined);
    });

    it("should throw validation error with wrong input of multi collection", () => {
      const requestExt = { query: { letter: ["a", "b", "d"] } } as unknown as RequestExt;
      const requestExpectation = new RequestExpectation(requestExt);
      expect(() => requestExpectation.containsQueryParam("letter", ["a", "b", "c"], "multi")).to.throw();
    });

    it("should throw validation error with wrong input of csv collection with common not encoded", () => {
      const requestExt = { query: { letter: "a,b,d" } } as unknown as RequestExt;
      const requestExpectation = new RequestExpectation(requestExt);
      expect(() => requestExpectation.containsQueryParam("letter", ["a", "b", "c"], "csv")).to.throw();
    });

    it("should validate successfully with correct input", () => {
      const requestExt = { query: { letter: "[a, b, c]" } } as unknown as RequestExt;
      const requestExpectation = new RequestExpectation(requestExt);
      expect(requestExpectation.containsQueryParam("letter", "[a, b, c]")).to.equal(undefined);
    });
  });
});
