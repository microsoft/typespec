import { describe, expect, it } from "vitest";
import {
  getSingleNameWithNamespace,
  sanitizeNameForGraphQL,
  toEnumMemberName,
  toFieldName,
  toTypeName,
} from "../../src/lib/type-utils.js";

describe("type-utils", () => {
  describe("sanitizeNameForGraphQL", () => {
    it("replaces special characters with underscores", () => {
      expect(sanitizeNameForGraphQL("$Money$")).toBe("_Money_");
      expect(sanitizeNameForGraphQL("My-Name")).toBe("My_Name");
      expect(sanitizeNameForGraphQL("Hello.World")).toBe("Hello_World");
    });

    it("replaces [] with Array", () => {
      expect(sanitizeNameForGraphQL("Item[]")).toBe("ItemArray");
    });

    it("leaves valid names unchanged", () => {
      expect(sanitizeNameForGraphQL("ValidName")).toBe("ValidName");
      expect(sanitizeNameForGraphQL("_underscore")).toBe("_underscore");
      expect(sanitizeNameForGraphQL("name123")).toBe("name123");
    });

    it("adds prefix for names starting with numbers", () => {
      expect(sanitizeNameForGraphQL("123Name")).toBe("_123Name");
      expect(sanitizeNameForGraphQL("1")).toBe("_1");
    });

    it("handles multiple special characters", () => {
      expect(sanitizeNameForGraphQL("$My-Special.Name$")).toBe("_My_Special_Name_");
    });

    it("handles empty prefix parameter", () => {
      expect(sanitizeNameForGraphQL("123Name", "")).toBe("_123Name");
    });

    it("uses custom prefix for invalid starting character", () => {
      expect(sanitizeNameForGraphQL("123Name", "Num")).toBe("Num_123Name");
    });
  });

  describe("toTypeName", () => {
    it("converts to PascalCase", () => {
      expect(toTypeName("my_name")).toBe("MyName");
      expect(toTypeName("some-value")).toBe("SomeValue");
      expect(toTypeName("hello_world")).toBe("HelloWorld");
    });

    it("preserves all-caps acronyms", () => {
      expect(toTypeName("API")).toBe("API");
      expect(toTypeName("APIResponse")).toBe("APIResponse");
      expect(toTypeName("myAPIKey")).toBe("MyAPIKey");
      expect(toTypeName("HTTPResponse")).toBe("HTTPResponse");
    });

    it("handles namespaced names by using only the last part", () => {
      expect(toTypeName("MyNamespace.MyType")).toBe("MyType");
      expect(toTypeName("A.B.C.MyType")).toBe("MyType");
    });

    it("sanitizes and converts special characters", () => {
      // Special chars become underscores, then PascalCase removes them
      expect(toTypeName("my-special$name")).toBe("MySpecialName");
      expect(toTypeName("$invalid")).toBe("Invalid");
    });
  });

  describe("toEnumMemberName", () => {
    it("converts to CONSTANT_CASE", () => {
      expect(toEnumMemberName("MyEnum", "myValue")).toBe("MY_VALUE");
      expect(toEnumMemberName("Status", "inProgress")).toBe("IN_PROGRESS");
    });

    it("handles already uppercase names", () => {
      expect(toEnumMemberName("MyEnum", "ACTIVE")).toBe("ACTIVE");
    });

    it("uses enum name as prefix for invalid starting characters", () => {
      expect(toEnumMemberName("Priority", "1High")).toBe("PRIORITY_1_HIGH");
    });

    it("handles special characters", () => {
      expect(toEnumMemberName("MyEnum", "value-with-dashes")).toBe("VALUE_WITH_DASHES");
    });

    it("separates numbers", () => {
      expect(toEnumMemberName("MyEnum", "value123")).toBe("VALUE_123");
    });
  });

  describe("toFieldName", () => {
    it("converts to camelCase", () => {
      expect(toFieldName("MyField")).toBe("myField");
      expect(toFieldName("SOME_VALUE")).toBe("someValue");
    });

    it("handles snake_case", () => {
      expect(toFieldName("my_field_name")).toBe("myFieldName");
    });

    it("handles special characters", () => {
      expect(toFieldName("my-field")).toBe("myField");
      expect(toFieldName("$special")).toBe("_special");
    });

    it("preserves leading underscores", () => {
      expect(toFieldName("_private")).toBe("_private");
      expect(toFieldName("__internal")).toBe("__internal");
    });
  });

  describe("getSingleNameWithNamespace", () => {
    it("replaces dots with underscores", () => {
      expect(getSingleNameWithNamespace("My.Namespace.Type")).toBe("My_Namespace_Type");
    });

    it("trims whitespace", () => {
      expect(getSingleNameWithNamespace("  My.Type  ")).toBe("My_Type");
    });

    it("handles names without namespace", () => {
      expect(getSingleNameWithNamespace("MyType")).toBe("MyType");
    });
  });
});
