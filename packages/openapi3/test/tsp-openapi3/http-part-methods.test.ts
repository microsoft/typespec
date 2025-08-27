import OpenAPIParser from "@apidevtools/swagger-parser";
import { formatTypeSpec } from "@typespec/compiler";
import { strictEqual } from "node:assert";
import { beforeAll, describe, it } from "vitest";
import { Context, createContext } from "../../src/cli/actions/convert/utils/context.js";
import { OpenAPI3Document, OpenAPI3Schema } from "../../src/types.js";

/**
 * Unit tests for the new HTTP part generation methods in SchemaToExpressionGenerator:
 * - getPartType: Wraps types in HttpPart and handles encoding/content-type headers
 * - isDefaultPartType: Determines if a part type has default content-type
 * - shouldUpgradeToFileDefinition: Determines if bytes should be upgraded to File<T>
 */
describe("tsp-openapi: HTTP part generation methods", () => {
  let context: Context;

  beforeAll(async () => {
    const parser = new OpenAPIParser();
    const doc = await parser.bundle({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {},
    });
    context = createContext(parser, doc as OpenAPI3Document);
  });

  describe("basic HTTP part wrapping", () => {
    it("should wrap object properties in HttpPart when isHttpPart=true", async () => {
      const schema = {
        type: "object" as const,
        properties: {
          textField: { type: "string" as const },
          numberField: { type: "integer" as const },
        },
        required: ["textField"],
      };

      const actualType = context.generateTypeFromRefableSchema(schema, [], true);
      const expected = "{textField: HttpPart<string>; numberField?: HttpPart<integer>}";

      const wrappedActual = await formatWrappedType(actualType);
      const wrappedExpected = await formatWrappedType(expected);
      strictEqual(wrappedActual, wrappedExpected);
    });

    it("should not wrap properties when isHttpPart=false", async () => {
      const schema = {
        type: "object" as const,
        properties: {
          textField: { type: "string" as const },
        },
      };

      const actualType = context.generateTypeFromRefableSchema(schema, [], false);
      const expected = "{textField?: string}";

      const wrappedActual = await formatWrappedType(actualType);
      const wrappedExpected = await formatWrappedType(expected);
      strictEqual(wrappedActual, wrappedExpected);
    });
  });

  describe("isDefaultPartType method behavior", () => {
    it("should recognize string with text/plain as default", async () => {
      const schema = {
        type: "object" as const,
        properties: {
          textField: { type: "string" as const },
        },
      };

      const encoding = {
        textField: { contentType: "text/plain" },
      };

      const actualType = context.generateTypeFromRefableSchema(schema, [], true, encoding);
      const expected = "{textField?: HttpPart<string>}"; // No content-type header added

      const wrappedActual = await formatWrappedType(actualType);
      const wrappedExpected = await formatWrappedType(expected);
      strictEqual(wrappedActual, wrappedExpected);
    });

    it("should recognize all numeric types with text/plain as default", async () => {
      const schema = {
        type: "object" as const,
        properties: {
          intField: { type: "integer" as const },
          floatField: { type: "number" as const, format: "float" },
          int32Field: { type: "integer" as const, format: "int32" },
          float64Field: { type: "number" as const, format: "double" },
          numericField: { type: "number" as const },
        },
      };

      const encoding = {
        intField: { contentType: "text/plain" },
        floatField: { contentType: "text/plain" },
        int32Field: { contentType: "text/plain" },
        float64Field: { contentType: "text/plain" },
        numericField: { contentType: "text/plain" },
      };

      const actualType = context.generateTypeFromRefableSchema(schema, [], true, encoding);
      const expected =
        "{intField?: HttpPart<integer>; floatField?: HttpPart<float32>; int32Field?: HttpPart<int32>; float64Field?: HttpPart<float64>; numericField?: HttpPart<numeric>}";

      const wrappedActual = await formatWrappedType(actualType);
      const wrappedExpected = await formatWrappedType(expected);
      strictEqual(wrappedActual, wrappedExpected);
    });

    it("should recognize bytes with application/octet-stream as default", async () => {
      const schema = {
        type: "object" as const,
        properties: {
          binaryField: { type: "string" as const, format: "byte" },
          binaryField2: { type: "string" as const, format: "binary" },
        },
      };

      const encoding = {
        binaryField: { contentType: "application/octet-stream" },
        binaryField2: { contentType: "application/octet-stream" },
      };

      const actualType = context.generateTypeFromRefableSchema(schema, [], true, encoding);
      const expected = "{binaryField?: HttpPart<bytes>; binaryField2?: HttpPart<bytes>}"; // No content-type header added

      const wrappedActual = await formatWrappedType(actualType);
      const wrappedExpected = await formatWrappedType(expected);
      strictEqual(wrappedActual, wrappedExpected);
    });

    it("should add content-type headers for non-default combinations", async () => {
      const schema = {
        type: "object" as const,
        properties: {
          jsonField: { type: "string" as const },
          xmlField: { type: "integer" as const },
          customBinaryField: { type: "string" as const, format: "byte" },
        },
      };

      const encoding = {
        jsonField: { contentType: "application/json" },
        xmlField: { contentType: "application/xml" },
        customBinaryField: { contentType: "image/png" },
      };

      const actualType = context.generateTypeFromRefableSchema(schema, [], true, encoding);
      const expected =
        '{jsonField?: HttpPart<string>; xmlField?: HttpPart<integer>; customBinaryField?: HttpPart<File<"image/png">>}';

      const wrappedActual = await formatWrappedType(actualType);
      const wrappedExpected = await formatWrappedType(expected);
      strictEqual(wrappedActual, wrappedExpected);
    });
  });

  describe("shouldUpgradeToFileDefinition method behavior", () => {
    it("should upgrade bytes to File when content type is not application/octet-stream", async () => {
      const schema = {
        type: "object" as const,
        properties: {
          imageFile: { type: "string" as const, format: "byte" },
          pdfFile: { type: "string" as const, format: "binary" },
          videoFile: { type: "string" as const, format: "byte" },
        },
      };

      const encoding = {
        imageFile: { contentType: "image/png" },
        pdfFile: { contentType: "application/pdf" },
        videoFile: { contentType: "video/mp4" },
      };

      const actualType = context.generateTypeFromRefableSchema(schema, [], true, encoding);
      const expected =
        '{imageFile?: HttpPart<File<"image/png">>; pdfFile?: HttpPart<File<"application/pdf">>; videoFile?: HttpPart<File<"video/mp4">>}';

      const wrappedActual = await formatWrappedType(actualType);
      const wrappedExpected = await formatWrappedType(expected);
      strictEqual(wrappedActual, wrappedExpected);
    });

    it("should upgrade bytes to File even with text/plain content type", async () => {
      const schema = {
        type: "object" as const,
        properties: {
          textFile: { type: "string" as const, format: "byte" },
          csvFile: { type: "string" as const, format: "binary" },
        },
      };

      const encoding = {
        textFile: { contentType: "text/plain" },
        csvFile: { contentType: "text/csv" },
      };

      const actualType = context.generateTypeFromRefableSchema(schema, [], true, encoding);
      const expected =
        '{textFile?: HttpPart<File<"text/plain">>; csvFile?: HttpPart<File<"text/csv">>}';

      const wrappedActual = await formatWrappedType(actualType);
      const wrappedExpected = await formatWrappedType(expected);
      strictEqual(wrappedActual, wrappedExpected);
    });

    it("should NOT upgrade bytes with default application/octet-stream", async () => {
      const schema = {
        type: "object" as const,
        properties: {
          defaultBinaryField: { type: "string" as const, format: "byte" },
        },
      };

      const encoding = {
        defaultBinaryField: { contentType: "application/octet-stream" },
      };

      const actualType = context.generateTypeFromRefableSchema(schema, [], true, encoding);
      const expected = "{defaultBinaryField?: HttpPart<bytes>}"; // No File upgrade, no content-type header

      const wrappedActual = await formatWrappedType(actualType);
      const wrappedExpected = await formatWrappedType(expected);
      strictEqual(wrappedActual, wrappedExpected);
    });

    it("should NOT upgrade non-bytes types to File", async () => {
      const schema = {
        type: "object" as const,
        properties: {
          textField: { type: "string" as const },
          intField: { type: "integer" as const },
          objectField: { type: "object" as const, properties: { id: { type: "string" as const } } },
        },
      };

      const encoding = {
        textField: { contentType: "image/png" },
        intField: { contentType: "application/pdf" },
        objectField: { contentType: "application/json" },
      };

      const actualType = context.generateTypeFromRefableSchema(schema, [], true, encoding);
      const expected =
        '{textField?: HttpPart<string>; intField?: HttpPart<integer>; objectField?: HttpPart<{id?: string} & { @header contentType "application/json" }>}';

      const wrappedActual = await formatWrappedType(actualType);
      const wrappedExpected = await formatWrappedType(expected);
      strictEqual(wrappedActual, wrappedExpected);
    });
  });

  describe("complete multipart form scenarios", () => {
    it("should handle complex multipart form with all features", async () => {
      const multipartSchema = {
        type: "object" as const,
        properties: {
          // String field with default content type
          name: { type: "string" as const },
          // Numeric field with default content type
          age: { type: "integer" as const },
          // Object field with custom content type (requires header)
          metadata: { type: "object" as const, properties: { id: { type: "integer" as const } } },
          // Binary field with default content type (no upgrade, no header)
          defaultBinary: { type: "string" as const, format: "byte" },
          // Binary field with custom content type (upgrade to File)
          avatar: { type: "string" as const, format: "binary" },
          // String field with custom content type (requires header)
          description: { type: "string" as const },
        },
        required: ["name", "avatar"],
      };

      const encoding = {
        name: { contentType: "text/plain" },
        age: { contentType: "text/plain" },
        metadata: { contentType: "application/json" },
        defaultBinary: { contentType: "application/octet-stream" },
        avatar: { contentType: "image/jpeg" },
        description: { contentType: "application/xml" },
      };

      const actualType = context.generateTypeFromRefableSchema(multipartSchema, [], true, encoding);

      const namePart = "name: HttpPart<string>"; // required, default content type
      const agePart = "age?: HttpPart<integer>"; // optional, default content type
      const metadataPart =
        'metadata?: HttpPart<{id?: integer} & { @header contentType "application/json" }>'; // custom content type
      const defaultBinaryPart = "defaultBinary?: HttpPart<bytes>"; // default binary content type
      const avatarPart = 'avatar: HttpPart<File<"image/jpeg">>'; // required, bytes upgraded to File
      const descriptionPart = "description?: HttpPart<string>"; // custom content type

      const expected = `{${namePart}; ${agePart}; ${metadataPart}; ${defaultBinaryPart}; ${avatarPart}; ${descriptionPart}}`;

      const wrappedActual = await formatWrappedType(actualType);
      const wrappedExpected = await formatWrappedType(expected);
      strictEqual(wrappedActual, wrappedExpected);
    });

    it("should handle edge cases: missing encoding, partial encoding", async () => {
      const schema = {
        type: "object" as const,
        properties: {
          fieldWithEncoding: { type: "string" as const },
          fieldWithoutEncoding: { type: "integer" as const },
          fieldWithEmptyEncoding: { type: "string" as const, format: "byte" },
        },
      };

      // Test with partial encoding object (some fields missing)
      const encoding = {
        fieldWithEncoding: { contentType: "application/json" },
        // fieldWithoutEncoding intentionally missing
        // fieldWithEmptyEncoding intentionally missing
      };

      const actualType = context.generateTypeFromRefableSchema(schema, [], true, encoding);
      const expected =
        "{fieldWithEncoding?: HttpPart<string>; fieldWithoutEncoding?: HttpPart<integer>; fieldWithEmptyEncoding?: HttpPart<bytes>}";

      const wrappedActual = await formatWrappedType(actualType);
      const wrappedExpected = await formatWrappedType(expected);
      strictEqual(wrappedActual, wrappedExpected);
    });

    it("should handle undefined and empty encoding objects", async () => {
      const schema = {
        type: "object" as const,
        properties: {
          field1: { type: "string" as const },
          field2: { type: "integer" as const },
        },
      };

      // Test with undefined encoding
      const actualType1 = context.generateTypeFromRefableSchema(schema, [], true, undefined);
      const expected1 = "{field1?: HttpPart<string>; field2?: HttpPart<integer>}";

      let wrappedActual = await formatWrappedType(actualType1);
      let wrappedExpected = await formatWrappedType(expected1);
      strictEqual(wrappedActual, wrappedExpected);

      // Test with empty encoding object
      const actualType2 = context.generateTypeFromRefableSchema(schema, [], true, {});
      const expected2 = "{field1?: HttpPart<string>; field2?: HttpPart<integer>}";

      wrappedActual = await formatWrappedType(actualType2);
      wrappedExpected = await formatWrappedType(expected2);
      strictEqual(wrappedActual, wrappedExpected);
    });
  });

  describe("integration with existing type generation", () => {
    it("should work with nested objects", async () => {
      const schema = {
        type: "object" as const,
        properties: {
          user: {
            type: "object" as const,
            properties: {
              profile: {
                type: "object" as const,
                properties: {
                  avatar: { type: "string" as const, format: "binary" },
                  bio: { type: "string" as const },
                },
              },
            },
          },
        },
      };

      const encoding = {
        user: { contentType: "application/json" },
      };

      const actualType = context.generateTypeFromRefableSchema(schema, [], true, encoding);
      const expected =
        '{user?: HttpPart<{profile?: {avatar?: bytes; bio?: string}} & { @header contentType "application/json" }>}';

      const wrappedActual = await formatWrappedType(actualType);
      const wrappedExpected = await formatWrappedType(expected);
      strictEqual(wrappedActual, wrappedExpected);
    });

    it("should work with arrays", async () => {
      const schema = {
        type: "object" as const,
        properties: {
          files: {
            type: "array" as const,
            items: { type: "string" as const, format: "binary" },
          },
        },
      };

      const encoding = {
        files: { contentType: "application/json" },
      };

      const actualType = context.generateTypeFromRefableSchema(schema, [], true, encoding);
      const expected = '{files?: HttpPart<bytes[] & { @header contentType "application/json" }>}';

      const wrappedActual = await formatWrappedType(actualType);
      const wrappedExpected = await formatWrappedType(expected);
      strictEqual(wrappedActual, wrappedExpected);
    });
  });

  describe("referenced schemas in multipart forms", () => {
    it("should treat referenced schemas as needing special handling in multipart context", async () => {
      // Simulate a referenced schema like #/components/schemas/PetOwnerProfileRequestBody
      const referencedSchema = {
        $ref: "#/components/schemas/PetOwnerProfileRequestBody" as const,
      };

      const encoding = {
        owner: { contentType: "application/json" },
        file: { contentType: "image/png" },
        referrer: { contentType: "text/plain" },
      };

      // For referenced schemas in multipart context, we return the reference name
      // The actual HttpPart wrapping should happen at the schema definition level
      const actualType = context.generateTypeFromRefableSchema(
        referencedSchema,
        [],
        true,
        encoding,
      );

      // Current behavior: just returns the reference name
      const expectedCurrent = "PetOwnerProfileRequestBody";
      strictEqual(actualType, expectedCurrent);
    });

    it("should handle inline multipart schema correctly", async () => {
      // This represents what the inline schema should generate
      const inlineSchema = {
        type: "object" as const,
        properties: {
          owner: {
            type: "object" as const,
            properties: {
              name: { type: "string" as const },
              pet: {
                type: "object" as const,
                properties: {
                  name: { type: "string" as const },
                  age_in_pet_years: { type: "integer" as const },
                },
                required: ["name"],
              },
            },
          },
          file: { type: "string" as const, format: "binary" },
          referrer: { type: "string" as const },
          age: { type: "integer" as const, format: "int32" },
        },
        required: ["owner", "file", "age"],
      };

      const encoding = {
        owner: { contentType: "application/json" },
        file: { contentType: "image/png" },
        referrer: { contentType: "text/plain" },
      };

      const actualType = context.generateTypeFromRefableSchema(inlineSchema, [], true, encoding);

      // This should generate HttpPart wrappers with proper encoding
      const ownerPart =
        'owner: HttpPart<{name?: string; pet?: {name: string; age_in_pet_years?: integer}} & { @header contentType "application/json" }>';
      const filePart = 'file: HttpPart<File<"image/png">>';
      const referrerPart = "referrer?: HttpPart<string>"; // text/plain is default for string
      const agePart = "age: HttpPart<int32>"; // text/plain is default for numeric

      const expected = `{${ownerPart}; ${filePart}; ${referrerPart}; ${agePart}}`;

      const wrappedActual = await formatWrappedType(actualType);
      const wrappedExpected = await formatWrappedType(expected);
      strictEqual(wrappedActual, wrappedExpected);
    });
  });

  it("does not emit a content type header for enums", async () => {
    const enumSchema: OpenAPI3Schema = {
      type: "string",
      enum: ["value1", "value2", "value3"],
    };
    context.openApi3Doc.components = { schemas: { MyEnum: enumSchema } };

    const mainObjectDef: OpenAPI3Schema = {
      type: "object",
      properties: {
        enum: { $ref: "#/components/schemas/MyEnum" },
      },
    };

    const encoding = {
      enum: { contentType: "application/json" },
    };

    const actualType = context.generateTypeFromRefableSchema(mainObjectDef, [], true, encoding);
    const expected = "model Test { `enum`?: HttpPart<MyEnum> }";

    const wrappedActual = await formatTypeSpec(`model Test${actualType}`);
    const wrappedExpected = await formatTypeSpec(expected);
    strictEqual(wrappedActual, wrappedExpected);
  });

  it("does not emit a content type header for enums arrays", async () => {
    const enumSchema: OpenAPI3Schema = {
      type: "string",
      enum: ["value1", "value2", "value3"],
    };
    context.openApi3Doc.components = { schemas: { MyEnum: enumSchema } };

    const mainObjectDef: OpenAPI3Schema = {
      type: "object",
      properties: {
        enum: {
          type: "array",
          items: { $ref: "#/components/schemas/MyEnum" },
        },
      },
    };

    const encoding = {
      enum: { contentType: "application/json" },
    };

    const actualType = context.generateTypeFromRefableSchema(mainObjectDef, [], true, encoding);
    const expected = "model Test { `enum`?: HttpPart<MyEnum[]> }";

    const wrappedActual = await formatTypeSpec(`model Test${actualType}`);
    const wrappedExpected = await formatTypeSpec(expected);
    strictEqual(wrappedActual, wrappedExpected);
  });

  it("does not generate min or max value for numeric parts", async () => {
    const mainObjectDef: OpenAPI3Schema = {
      type: "object",
      properties: {
        myInt: { type: "number", format: "int32", maximum: 100, minimum: 0 },
      },
    };

    const actualType = context.generateTypeFromRefableSchema(mainObjectDef, [], true);
    const expected = "model Test { myInt?: HttpPart<numeric> }";

    const wrappedActual = await formatTypeSpec(`model Test${actualType}`);
    const wrappedExpected = await formatTypeSpec(expected);
    strictEqual(wrappedActual, wrappedExpected);
  });

  it("does not set the content type for a nullable property", async () => {
    const mainObjectDef: OpenAPI3Schema = {
      type: "object",
      properties: {
        myString: { type: "string", nullable: true },
      },
    };

    const encoding = {
      myString: { contentType: "application/json" },
    };

    const actualType = context.generateTypeFromRefableSchema(mainObjectDef, [], true, encoding);
    const expected = "model Test { myString?: HttpPart<string | null> }";

    const wrappedActual = await formatTypeSpec(`model Test${actualType}`);
    const wrappedExpected = await formatTypeSpec(expected);
    strictEqual(wrappedActual, wrappedExpected);
  });
});

// Wrap the expected and actual types in this model to get formatted types.
function formatWrappedType(type: string): Promise<string> {
  return formatTypeSpec(`model Test { test: ${type}; }`);
}
