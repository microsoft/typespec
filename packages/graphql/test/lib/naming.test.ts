import { describe, expect, it } from "vitest";
import {
  applyEnumMemberPipeline,
  applyFieldNamePipeline,
  applyTypeNamePipeline,
} from "../../src/lib/naming.js";

describe("naming pipelines", () => {
  describe("applyTypeNamePipeline", () => {
    const noContext = { isInput: false, isInterface: false };

    it("PascalCases a snake_case name", () => {
      expect(applyTypeNamePipeline("ad_account", noContext)).toBe("AdAccount");
    });

    it("strips namespace prefix", () => {
      expect(applyTypeNamePipeline("Pinterest.API.Board", noContext)).toBe("Board");
    });

    it("prepends underscore for names starting with digit", () => {
      expect(applyTypeNamePipeline("123foo", noContext)).toBe("_123foo");
    });

    it("handles acronyms in mixed-case names", () => {
      // Each letter of the acronym becomes its own word → PascalCase capitalizes each
      expect(applyTypeNamePipeline("APIResponse", noContext)).toBe("APIResponse");
    });

    it("replaces array syntax", () => {
      expect(applyTypeNamePipeline("Fruit[]", noContext)).toBe("FruitArray");
    });

    it("replaces non-word characters with underscore", () => {
      expect(applyTypeNamePipeline("user-name", noContext)).toBe("UserName");
    });

    it("appends Input suffix when isInput is true", () => {
      expect(applyTypeNamePipeline("User", { isInput: true, isInterface: false })).toBe(
        "UserInput",
      );
    });

    it("does not double-append Input suffix", () => {
      expect(applyTypeNamePipeline("UserInput", { isInput: true, isInterface: false })).toBe(
        "UserInput",
      );
    });

    it("appends Interface suffix when isInterface is true", () => {
      expect(applyTypeNamePipeline("Node", { isInput: false, isInterface: true })).toBe(
        "NodeInterface",
      );
    });

    it("does not double-append Interface suffix", () => {
      expect(applyTypeNamePipeline("NodeInterface", { isInput: false, isInterface: true })).toBe(
        "NodeInterface",
      );
    });

    it("preserves all-caps names", () => {
      expect(applyTypeNamePipeline("URL", noContext)).toBe("URL");
    });
  });

  describe("applyFieldNamePipeline", () => {
    it("camelCases a snake_case name", () => {
      expect(applyFieldNamePipeline("ad_account_id")).toBe("adAccountId");
    });

    it("camelCases a SCREAMING_SNAKE name", () => {
      expect(applyFieldNamePipeline("FIRST_NAME")).toBe("firstName");
    });

    it("sanitizes dots in field names", () => {
      expect(applyFieldNamePipeline("Namespace.fieldName")).toBe("namespaceFieldName");
    });

    it("preserves prefix underscore for names starting with digit", () => {
      expect(applyFieldNamePipeline("123field")).toBe("_123field");
    });
  });

  describe("applyEnumMemberPipeline", () => {
    it("converts camelCase to CONSTANT_CASE", () => {
      expect(applyEnumMemberPipeline("myValue")).toBe("MY_VALUE");
    });

    it("converts camelCase status to CONSTANT_CASE", () => {
      expect(applyEnumMemberPipeline("activeStatus")).toBe("ACTIVE_STATUS");
    });

    it("preserves already CONSTANT_CASE", () => {
      expect(applyEnumMemberPipeline("ALREADY_CONSTANT")).toBe("ALREADY_CONSTANT");
    });

    it("handles names starting with digits", () => {
      expect(applyEnumMemberPipeline("123value")).toBe("_123_VALUE");
    });
  });
});
