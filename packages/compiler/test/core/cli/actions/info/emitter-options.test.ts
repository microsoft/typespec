import { describe, expect, it } from "vitest";
import {
  extractEmitterOptionsInfo,
  formatEmitterOptions,
} from "../../../../../src/core/cli/actions/info/emitter-options.js";

describe("extractEmitterOptionsInfo", () => {
  it("returns empty array for undefined schema", () => {
    expect(extractEmitterOptionsInfo(undefined)).toEqual([]);
  });

  it("returns empty array for schema with no properties", () => {
    expect(extractEmitterOptionsInfo({ type: "object" })).toEqual([]);
  });

  it("extracts string option with enum", () => {
    const schema = {
      type: "object",
      properties: {
        "file-type": {
          type: "string",
          enum: ["yaml", "json"],
          nullable: true,
          description: "Output format",
        },
      },
    };
    const result = extractEmitterOptionsInfo(schema);
    expect(result).toEqual([
      {
        name: "file-type",
        type: "string",
        allowedValues: ["yaml", "json"],
        description: "Output format",
      },
    ]);
  });

  it("extracts boolean option with default", () => {
    const schema = {
      type: "object",
      properties: {
        "seal-object-schemas": {
          type: "boolean",
          nullable: true,
          default: false,
        },
      },
    };
    const result = extractEmitterOptionsInfo(schema);
    expect(result).toEqual([
      {
        name: "seal-object-schemas",
        type: "boolean",
        default: "false",
      },
    ]);
  });

  it("extracts array option with items", () => {
    const schema = {
      type: "object",
      properties: {
        "openapi-versions": {
          type: "array",
          items: {
            type: "string",
            enum: ["3.0.0", "3.1.0"],
          },
          default: ["3.0.0"],
          description: "OpenAPI versions to emit.",
        },
      },
    };
    const result = extractEmitterOptionsInfo(schema);
    expect(result).toEqual([
      {
        name: "openapi-versions",
        type: "string[]",
        default: '["3.0.0"]',
        description: "OpenAPI versions to emit.",
      },
    ]);
  });

  it("extracts option with oneOf", () => {
    const schema = {
      type: "object",
      properties: {
        "operation-id": {
          oneOf: [
            { type: "string", enum: ["auto", "manual"] },
            { type: "object", properties: { kind: { type: "string" } } },
          ],
        },
      },
    };
    const result = extractEmitterOptionsInfo(schema);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("operation-id");
    expect(result[0].type).toBe("string | object { kind }");
  });

  it("extracts option with description as array", () => {
    const schema = {
      type: "object",
      properties: {
        "output-file": {
          type: "string",
          nullable: true,
          description: ["Line 1", "Line 2"],
        },
      },
    };
    const result = extractEmitterOptionsInfo(schema);
    expect(result[0].description).toBe("Line 1\nLine 2");
  });

  it("extracts multiple options", () => {
    const schema = {
      type: "object",
      properties: {
        "file-type": { type: "string", enum: ["yaml", "json"] },
        "new-line": { type: "string", enum: ["crlf", "lf"], default: "lf" },
        noEmit: { type: "boolean", description: "Do not emit files." },
      },
    };
    const result = extractEmitterOptionsInfo(schema);
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("file-type");
    expect(result[1].name).toBe("new-line");
    expect(result[2].name).toBe("noEmit");
  });
});

describe("formatEmitterOptions", () => {
  it("shows no options message for empty schema", () => {
    const lines = formatEmitterOptions("@typespec/test", undefined);
    const text = lines.join("\n");
    expect(text).toContain("@typespec/test");
    expect(text).toContain("does not define any options");
  });

  it("shows no options message for schema with no properties", () => {
    const lines = formatEmitterOptions("@typespec/test", { type: "object" });
    const text = lines.join("\n");
    expect(text).toContain("does not define any options");
  });

  it("formats options with types, enums, defaults, and descriptions", () => {
    const schema = {
      type: "object",
      properties: {
        "file-type": {
          type: "string",
          enum: ["yaml", "json"],
          nullable: true,
          description: "Output file format.",
        },
        "new-line": {
          type: "string",
          enum: ["crlf", "lf"],
          default: "lf",
          nullable: true,
        },
        noEmit: {
          type: "boolean",
          nullable: true,
          default: false,
          description: "Do not emit files.",
        },
      },
    };
    const lines = formatEmitterOptions("@typespec/openapi3", schema);
    const text = lines.join("\n");

    // Contains emitter name
    expect(text).toContain("@typespec/openapi3");

    // Contains option names
    expect(text).toContain("file-type");
    expect(text).toContain("new-line");
    expect(text).toContain("noEmit");

    // Contains type info
    expect(text).toContain("string");
    expect(text).toContain("boolean");

    // Contains enum values
    expect(text).toContain("yaml");
    expect(text).toContain("json");

    // Contains defaults
    expect(text).toContain("lf");
    expect(text).toContain("false");

    // Contains descriptions
    expect(text).toContain("Output file format.");
    expect(text).toContain("Do not emit files.");
  });

  it("formats option inline with name, type on same line", () => {
    const schema = {
      type: "object",
      properties: {
        test: { type: "string", description: "A test option." },
      },
    };
    const lines = formatEmitterOptions("@typespec/test", schema);
    // Name and type should be on the same line
    const headerLine = lines.find((l) => l.includes("test") && l.includes("string"));
    expect(headerLine).toBeDefined();
  });
});
