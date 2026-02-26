import { describe, expect, it } from "vitest";
import {
  extractEmitterOptionsInfo,
  formatEmitterOptions,
  formatLibraryInfo,
} from "../../../../../src/core/cli/actions/info/emitter-options.js";
import { d } from "../../../../test-utils.js";

/** Strip ANSI escape codes to get plain text for assertions */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

function formatOptionsPlain(schema: any): string {
  return stripAnsi(formatEmitterOptions(schema).join("\n"));
}

function formatInfoPlain(manifest: any): string {
  return stripAnsi(formatLibraryInfo(manifest).join("\n"));
}

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
          items: { type: "string", enum: ["3.0.0", "3.1.0"] },
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

  it("extracts oneOf as variants with nested object properties", () => {
    const schema = {
      type: "object",
      properties: {
        "operation-id": {
          oneOf: [
            { type: "string", enum: ["auto", "manual"] },
            {
              type: "object",
              properties: {
                kind: { type: "string" },
                separator: { type: "string" },
              },
            },
          ],
        },
      },
    };
    const result = extractEmitterOptionsInfo(schema);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("operation-id");
    expect(result[0].variants).toHaveLength(2);
    expect(result[0].variants![0].allowedValues).toEqual(["auto", "manual"]);
    expect(result[0].variants![1].type).toBe("object");
    expect(result[0].variants![1].nestedOptions).toHaveLength(2);
    expect(result[0].variants![1].nestedOptions![0].name).toBe("kind");
    expect(result[0].variants![1].nestedOptions![1].name).toBe("separator");
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
});

describe("formatLibraryInfo", () => {
  it("shows name and version", () => {
    expect(formatInfoPlain({ name: "@typespec/openapi3", version: "1.2.3" })).toBe(d`
      Library

        Name: @typespec/openapi3
        Version: 1.2.3
    `);
  });

  it("shows name, version, description, and homepage", () => {
    expect(
      formatInfoPlain({
        name: "@typespec/openapi3",
        version: "1.2.3",
        description: "OpenAPI 3 emitter for TypeSpec",
        homepage: "https://typespec.io",
      }),
    ).toBe(d`
      Library

        Name: @typespec/openapi3
        Version: 1.2.3
        Description: OpenAPI 3 emitter for TypeSpec
        Homepage: https://typespec.io
    `);
  });

  it("shows unknown when manifest is undefined", () => {
    expect(formatInfoPlain(undefined)).toBe(d`
      Library

        Name: unknown
    `);
  });

  it("shows name without version when version is missing", () => {
    expect(formatInfoPlain({ name: "@typespec/openapi3" })).toBe(d`
      Library

        Name: @typespec/openapi3
    `);
  });
});

describe("formatEmitterOptions", () => {
  it("shows message when emitter has no options", () => {
    expect(formatOptionsPlain(undefined)).toBe(d`
      Emitter Options

        This emitter does not define any options.
    `);
  });

  it("shows message when schema has no properties", () => {
    expect(formatOptionsPlain({ type: "object" })).toBe(d`
      Emitter Options

        This emitter does not define any options.
    `);
  });

  it("formats enum option with description", () => {
    const schema = {
      type: "object",
      properties: {
        "file-type": {
          type: "string",
          enum: ["yaml", "json"],
          description: "Output format.",
        },
      },
    };
    expect(formatOptionsPlain(schema)).toBe(d`
      Emitter Options

        file-type: "yaml" | "json"
          Output format.

    `);
  });

  it("formats boolean option with default", () => {
    const schema = {
      type: "object",
      properties: {
        noEmit: {
          type: "boolean",
          default: false,
          description: "Do not emit files.",
        },
      },
    };
    expect(formatOptionsPlain(schema)).toBe(d`
      Emitter Options

        noEmit: boolean (default: false)
          Do not emit files.

    `);
  });

  it("formats multiple options together", () => {
    const schema = {
      type: "object",
      properties: {
        "file-type": {
          type: "string",
          enum: ["yaml", "json"],
          description: "Output file format.",
        },
        "new-line": {
          type: "string",
          enum: ["crlf", "lf"],
          default: "lf",
        },
        noEmit: {
          type: "boolean",
          default: false,
          description: "Do not emit files.",
        },
      },
    };
    expect(formatOptionsPlain(schema)).toBe(d`
      Emitter Options

        file-type: "yaml" | "json"
          Output file format.

        new-line: "crlf" | "lf" (default: "lf")

        noEmit: boolean (default: false)
          Do not emit files.

    `);
  });

  it("formats union variants with - prefix and nested properties", () => {
    const schema = {
      type: "object",
      properties: {
        strategy: {
          oneOf: [
            {
              type: "string",
              enum: ["auto", "manual"],
              default: "auto",
              description: "Simple strategy.",
            },
            {
              type: "object",
              properties: {
                kind: {
                  type: "string",
                  enum: ["auto", "manual"],
                  description: "The strategy kind.",
                },
                separator: { type: "string", description: "Separator character." },
              },
            },
          ],
        },
      },
    };
    expect(formatOptionsPlain(schema)).toBe(d`
      Emitter Options

        strategy:
          - "auto" | "manual" (default: "auto")
            Simple strategy.
          - object
            kind: "auto" | "manual"
              The strategy kind.

            separator: string
              Separator character.


    `);
  });

  it("renders markdown inline code and links in descriptions", () => {
    const schema = {
      type: "object",
      properties: {
        output: {
          type: "string",
          description: "Use `json` format. See [docs](https://example.com) for details.",
        },
      },
    };
    expect(formatOptionsPlain(schema)).toBe(d`
      Emitter Options

        output: string
          Use json format. See docs https://example.com for details.

    `);
  });
});
