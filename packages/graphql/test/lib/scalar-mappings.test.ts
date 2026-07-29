import { describe, expect, it } from "vitest";
import { resolveScalarToGraphQL } from "../../src/lib/scalar-mappings.js";

describe("resolveScalarToGraphQL", () => {
  describe("GraphQL built-in scalars", () => {
    it.each([
      ["string", "String"],
      ["boolean", "Boolean"],
      ["int32", "Int"],
      ["float32", "Float"],
      ["float64", "Float"],
    ])("maps %s to %s", (tspScalar, graphqlType) => {
      expect(resolveScalarToGraphQL(tspScalar)).toBe(graphqlType);
    });
  });

  describe("integer types that fit in GraphQL Int", () => {
    it.each([
      ["int8", "Int"],
      ["int16", "Int"],
      ["uint8", "Int"],
      ["uint16", "Int"],
    ])("maps %s to %s", (tspScalar, graphqlType) => {
      expect(resolveScalarToGraphQL(tspScalar)).toBe(graphqlType);
    });
  });

  describe("integer types that exceed GraphQL Int range", () => {
    it.each([
      ["int64", "String"],
      ["uint32", "String"],
      ["uint64", "String"],
      ["safeint", "String"],
      ["integer", "String"],
    ])("maps %s to %s", (tspScalar, graphqlType) => {
      expect(resolveScalarToGraphQL(tspScalar)).toBe(graphqlType);
    });
  });

  describe("numeric/decimal types", () => {
    it.each([
      ["numeric", "String"],
      ["float", "Float"],
      ["decimal", "String"],
      ["decimal128", "String"],
    ])("maps %s to %s", (tspScalar, graphqlType) => {
      expect(resolveScalarToGraphQL(tspScalar)).toBe(graphqlType);
    });
  });

  describe("date/time types", () => {
    it.each([
      ["plainDate", "String"],
      ["plainTime", "String"],
      ["utcDateTime", "String"],
      ["offsetDateTime", "String"],
      ["duration", "String"],
    ])("maps %s to %s", (tspScalar, graphqlType) => {
      expect(resolveScalarToGraphQL(tspScalar)).toBe(graphqlType);
    });
  });

  describe("other types", () => {
    it.each([
      ["bytes", "String"],
      ["url", "String"],
    ])("maps %s to %s", (tspScalar, graphqlType) => {
      expect(resolveScalarToGraphQL(tspScalar)).toBe(graphqlType);
    });
  });

  describe("GraphQL library scalar", () => {
    it("maps ID to ID", () => {
      expect(resolveScalarToGraphQL("ID")).toBe("ID");
    });
  });

  describe("user-defined scalars", () => {
    it("returns unknown scalar names unchanged", () => {
      expect(resolveScalarToGraphQL("MyCustomScalar")).toBe("MyCustomScalar");
    });
  });
});
