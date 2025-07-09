import { describe, expect, it } from "vitest";
import { RequestExpectation } from "../src/expectation.js";
import { RequestExt } from "../src/types.js";
import { validateBodyEquals, validateCoercedDateBodyEquals, validateRawBodyEquals } from "../src/request-validations.js";

describe("Dictionary order sensitivity", () => {
  it("should demonstrate current issue with string serialization order", () => {
    // Test what actually happens when we serialize dictionaries
    const dict1 = { k2: 2, k1: 1 };
    const dict2 = { k1: 1, k2: 2 };
    
    const str1 = JSON.stringify(dict1);
    const str2 = JSON.stringify(dict2);
    
    console.log("Dictionary 1 string:", str1);  // {"k2":2,"k1":1}
    console.log("Dictionary 2 string:", str2);  // {"k1":1,"k2":2}
    
    // They create different JSON strings due to key order
    expect(str1).not.toEqual(str2);
  });

  it("should now handle raw body comparison with different key order", () => {
    // This used to be the issue - now it should pass
    const requestExt = {
      body: { k2: 2, k1: 1 },
      rawBody: '{"k2":2,"k1":1}',
    } as RequestExt;
    
    // Expected raw body with different key order
    const expectedRawBody = '{"k1":1,"k2":2}';
    
    // This now passes due to semantic JSON comparison
    expect(() => validateRawBodyEquals(requestExt, expectedRawBody)).not.toThrow();
  });

  it("should handle dictionaries with different key orders using direct validation", () => {
    // Simulate request with dictionary in one order where body is parsed JSON
    const requestExt = {
      body: JSON.parse('{"k2":2,"k1":1}'), // This creates object with different internal order potentially
      rawBody: '{"k2":2,"k1":1}',
    } as RequestExt;
    
    // Expected dictionary in different order
    const expectedBody = { k1: 1, k2: 2 };
    
    // Test the actual validation function directly
    expect(() => validateBodyEquals(requestExt, expectedBody)).not.toThrow();
  });

  it("should handle dictionaries with different key orders", () => {
    // Simulate request with dictionary in one order
    const requestExt = {
      body: { k2: 2, k1: 1 },
      rawBody: JSON.stringify({ k2: 2, k1: 1 }),
    } as RequestExt;
    
    const requestExpectation = new RequestExpectation(requestExt);
    
    // Expected dictionary in different order
    const expectedBody = { k1: 1, k2: 2 };
    
    // This should pass - bodyEquals uses parsed body comparison which handles order
    expect(() => requestExpectation.bodyEquals(expectedBody)).not.toThrow();
  });

  it("should now handle rawBodyEquals with different key order", () => {
    // Simulate request with dictionary in one order
    const requestExt = {
      body: { k2: 2, k1: 1 },
      rawBody: '{"k2":2,"k1":1}',
    } as RequestExt;
    
    const requestExpectation = new RequestExpectation(requestExt);
    
    // Expected raw body string with different key order
    const expectedRawBody = '{"k1":1,"k2":2}';
    
    // This now passes due to semantic JSON comparison
    expect(() => requestExpectation.rawBodyEquals(expectedRawBody)).not.toThrow();
  });

  it("should handle nested dictionaries with different key orders", () => {
    // Simulate request with nested dictionary in one order
    const requestExt = {
      body: { 
        outer: { k2: 2, k1: 1 },
        data: "test"
      },
      rawBody: JSON.stringify({ 
        outer: { k2: 2, k1: 1 },
        data: "test"
      }),
    } as RequestExt;
    
    const requestExpectation = new RequestExpectation(requestExt);
    
    // Expected nested dictionary in different order
    const expectedBody = { 
      data: "test",
      outer: { k1: 1, k2: 2 }
    };
    
    // This should pass
    expect(() => requestExpectation.bodyEquals(expectedBody)).not.toThrow();
  });

  it("should handle coerced dictionaries with different key orders", () => {
    // Simulate request with dictionary in one order
    const requestExt = {
      body: { k2: "2022-08-26T18:38:00.000Z", k1: "2022-08-26T18:38:00.000Z" },
      rawBody: JSON.stringify({ k2: "2022-08-26T18:38:00.000Z", k1: "2022-08-26T18:38:00.000Z" }),
    } as RequestExt;
    
    const requestExpectation = new RequestExpectation(requestExt);
    
    // Expected dictionary in different order with coerced dates
    const expectedBody = { k1: "2022-08-26T18:38:00Z", k2: "2022-08-26T18:38:00Z" };
    
    // This should pass
    expect(() => requestExpectation.coercedBodyEquals(expectedBody)).not.toThrow();
  });

  it("should still fail for semantically different dictionaries", () => {
    // Simulate request with dictionary 
    const requestExt = {
      body: { k1: 1, k2: 2 },
      rawBody: JSON.stringify({ k1: 1, k2: 2 }),
    } as RequestExt;
    
    const requestExpectation = new RequestExpectation(requestExt);
    
    // Expected dictionary with different values
    const expectedBody = { k1: 1, k2: 3 };
    
    // This should still fail because the values are actually different
    expect(() => requestExpectation.bodyEquals(expectedBody)).toThrow();
  });

  it("should still fail for dictionaries with different keys", () => {
    // Simulate request with dictionary 
    const requestExt = {
      body: { k1: 1, k2: 2 },
      rawBody: JSON.stringify({ k1: 1, k2: 2 }),
    } as RequestExt;
    
    const requestExpectation = new RequestExpectation(requestExt);
    
    // Expected dictionary with different keys
    const expectedBody = { k1: 1, k3: 2 };
    
    // This should still fail because the keys are actually different
    expect(() => requestExpectation.bodyEquals(expectedBody)).toThrow();
  });

  it("should handle non-JSON content normally", () => {
    // Test non-JSON raw body comparison
    const requestExt = {
      body: "plain text content",
      rawBody: "plain text content",
    } as RequestExt;
    
    const requestExpectation = new RequestExpectation(requestExt);
    
    // Expected different plain text
    const expectedRawBody = "different plain text";
    
    // This should still fail for different plain text content
    expect(() => requestExpectation.rawBodyEquals(expectedRawBody)).toThrow();
  });

  it("should handle invalid JSON gracefully", () => {
    // Test invalid JSON that can't be parsed
    const requestExt = {
      body: '{"invalid": json}',
      rawBody: '{"invalid": json}',
    } as RequestExt;
    
    const requestExpectation = new RequestExpectation(requestExt);
    
    // Expected different invalid JSON
    const expectedRawBody = '{"different": invalid}';
    
    // This should fall back to string comparison and fail
    expect(() => requestExpectation.rawBodyEquals(expectedRawBody)).toThrow();
  });

  it("should still pass for identical non-JSON content", () => {
    // Test identical non-JSON raw body comparison
    const requestExt = {
      body: "identical text content",
      rawBody: "identical text content",
    } as RequestExt;
    
    const requestExpectation = new RequestExpectation(requestExt);
    
    // Expected identical plain text
    const expectedRawBody = "identical text content";
    
    // This should pass for identical content
    expect(() => requestExpectation.rawBodyEquals(expectedRawBody)).not.toThrow();
  });
});