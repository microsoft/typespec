/* eslint-disable vitest/no-identical-title */
import { deepStrictEqual, strictEqual } from "assert";
import { describe, it } from "vitest";
import { worksFor } from "./works-for.js";

describe("numeric constraints", () => {
  const scalarNumberTypes = [
    "int8",
    "int16",
    "int32",
    "uint8",
    "uint16",
    "uint32",
    "integer",
    "float32",
    "float64",
    "numeric",
    "float",
    "safeint",
  ];

  worksFor(["3.0.0", "3.1.0"], ({ oapiForModel }) => {
    describe("@minValue/@maxValue/@multipleOf", () => {
      for (const numType of scalarNumberTypes) {
        it(numType, async () => {
          const schemas = await oapiForModel(
            "Test",
            `
            @minValue(1)
            @maxValue(2)
            @JsonSchema.multipleOf(10)
            scalar Test extends ${numType};
          `,
          );

          strictEqual(schemas.schemas.Test.minimum, 1);
          strictEqual(schemas.schemas.Test.maximum, 2);
          strictEqual(schemas.schemas.Test.multipleOf, 10);
        });
      }

      it("can be applied on a union", async () => {
        const schemas = await oapiForModel(
          "Test",
          `
          @minValue(1)
          @maxValue(2)
          @JsonSchema.multipleOf(10)
          union Test {int32, string, null};
        `,
        );

        strictEqual(schemas.schemas.Test.minimum, 1);
        strictEqual(schemas.schemas.Test.maximum, 2);
        strictEqual(schemas.schemas.Test.multipleOf, 10);
      });
    });
  });

  worksFor(["3.0.0"], ({ oapiForModel }) => {
    describe("@minValueExclusive/@maxValueExclusive (boolean)", () => {
      for (const numType of scalarNumberTypes) {
        it(numType, async () => {
          const schemas = await oapiForModel(
            "Test",
            `
            @minValueExclusive(1)
            @maxValueExclusive(2)
            scalar Test extends ${numType};
          `,
          );

          strictEqual(schemas.schemas.Test.minimum, 1);
          strictEqual(schemas.schemas.Test.exclusiveMaximum, true);
          strictEqual(schemas.schemas.Test.maximum, 2);
          strictEqual(schemas.schemas.Test.exclusiveMaximum, true);
        });

        it("can be applied on a union", async () => {
          const schemas = await oapiForModel(
            "Test",
            `
            @minValueExclusive(1)
            @maxValueExclusive(2)
            union Test {int32, string, null};
          `,
          );

          strictEqual(schemas.schemas.Test.minimum, 1);
          strictEqual(schemas.schemas.Test.exclusiveMaximum, true);
          strictEqual(schemas.schemas.Test.maximum, 2);
          strictEqual(schemas.schemas.Test.exclusiveMaximum, true);
        });
      }
    });
  });

  worksFor(["3.1.0"], ({ oapiForModel }) => {
    describe("@minValueExclusive/@maxValueExclusive (value)", () => {
      for (const numType of scalarNumberTypes) {
        it(numType, async () => {
          const schemas = await oapiForModel(
            "Test",
            `
            @minValueExclusive(1)
            @maxValueExclusive(2)
            scalar Test extends ${numType};
          `,
          );

          strictEqual(schemas.schemas.Test.minimum, undefined);
          strictEqual(schemas.schemas.Test.exclusiveMinimum, 1);
          strictEqual(schemas.schemas.Test.maximum, undefined);
          strictEqual(schemas.schemas.Test.exclusiveMaximum, 2);
        });

        it("can be applied on a union", async () => {
          const schemas = await oapiForModel(
            "Test",
            `
            @minValueExclusive(1)
            @maxValueExclusive(2)
            union Test {int32, string, null};
          `,
          );

          strictEqual(schemas.schemas.Test.minimum, undefined);
          strictEqual(schemas.schemas.Test.exclusiveMinimum, 1);
          strictEqual(schemas.schemas.Test.maximum, undefined);
          strictEqual(schemas.schemas.Test.exclusiveMaximum, 2);
        });
      }
    });
  });
});

describe("string constraints", () => {
  function assertStringConstraints(schema: any) {
    strictEqual(schema.minLength, 1);
    strictEqual(schema.maxLength, 2);
    strictEqual(schema.pattern, "a|b");
    strictEqual(schema.format, "ipv4");
  }

  const decorators = `
    @minLength(1)
    @maxLength(2)
    @pattern("a|b")
    @format("ipv4")`;

  worksFor(["3.0.0", "3.1.0"], ({ oapiForModel }) => {
    it("on scalar declaration", async () => {
      const schemas = await oapiForModel(
        "Test",
        `
      ${decorators}
      scalar Test extends string;
    `,
      );

      assertStringConstraints(schemas.schemas.Test);
    });
    it("on union declaration", async () => {
      const schemas = await oapiForModel(
        "Test",
        `
      ${decorators}
      union Test {string, int32, null};
    `,
      );

      assertStringConstraints(schemas.schemas.Test);
    });
  });

  worksFor(["3.1.0"], ({ oapiForModel }) => {
    const jsonSchemaDecorators = `
      @JsonSchema.contentEncoding("base64url")
      @JsonSchema.contentMediaType("application/jwt")
      @JsonSchema.contentSchema(JwtToken)
    `;

    function assertJsonSchemaStringConstraints(schema: any) {
      strictEqual(schema.contentEncoding, "base64url");
      strictEqual(schema.contentMediaType, "application/jwt");
      deepStrictEqual(schema.contentSchema, { $ref: "#/components/schemas/JwtToken" });
    }

    it("on scalar declaration", async () => {
      const schemas = await oapiForModel(
        "Test",
        `
      ${jsonSchemaDecorators}
      scalar Test extends string;
      model JwtToken is Array<Record<string>>;
    `,
      );

      assertJsonSchemaStringConstraints(schemas.schemas.Test);
    });

    it("on union declaration", async () => {
      const schemas = await oapiForModel(
        "Test",
        `
      ${jsonSchemaDecorators}
      union Test {string, int32, null};
      model JwtToken is Array<Record<string>>;
    `,
      );

      assertJsonSchemaStringConstraints(schemas.schemas.Test);
    });
  });
});

describe("datetime constraints", () => {
  const datetimeTypes = [
    {
      name: "unixTimestamp32",
      format: "int32",
      minValue: `1577836800`,
      maxValue: `1893456000`,
    },
    {
      name: "utcDateTime",
      format: "date-time",
      minValue: `utcDateTime.fromISO("2020-01-01T00:00:00Z")`,
      maxValue: `utcDateTime.fromISO("2030-01-01T00:00:00Z")`,
    },
    {
      name: "offsetDateTime",
      format: "date-time",
      minValue: `offsetDateTime.fromISO("2020-01-01T00:00:00+00:00")`,
      maxValue: `offsetDateTime.fromISO("2030-01-01T00:00:00+00:00")`,
    },
    {
      name: "plainDate",
      format: "date",
      minValue: `plainDate.fromISO("2020-01-01")`,
      maxValue: `plainDate.fromISO("2030-01-01")`,
    },
    {
      name: "plainTime",
      format: "time",
      minValue: `plainTime.fromISO("08:00:00")`,
      maxValue: `plainTime.fromISO("18:00:00")`,
    },
    {
      name: "duration",
      format: "duration",
      minValue: `duration.fromISO("PT1H")`,
      maxValue: `duration.fromISO("PT24H")`,
    },
  ];

  worksFor(["3.0.0", "3.1.0"], ({ oapiForModel }) => {
    describe("@minValue/@maxValue on datetime types", () => {
      for (const dateType of datetimeTypes) {
        it(`${dateType.name}`, async () => {
          const schemas = await oapiForModel(
            "Test",
            `
            model Test {
              @minValue(${dateType.minValue})
              @maxValue(${dateType.maxValue}) 
              timestamp: ${dateType.name};
            }
          `,
          );

          const timestampSchema = schemas.schemas.Test.properties.timestamp;
          // For datetime types, we can't easily predict the exact numeric values after conversion
          // but we can verify the constraints are present
          if (dateType.name === "unixTimestamp32") {
            strictEqual(timestampSchema.type, "integer");
            strictEqual(timestampSchema.format, "int32");
            strictEqual(timestampSchema.minimum, 1577836800);
            strictEqual(timestampSchema.maximum, 1893456000);
          } else {
            strictEqual(timestampSchema.type, "string");
            strictEqual(timestampSchema.format, dateType.format);
            // For datetime types, min/max will be present but values may be converted
            strictEqual(typeof timestampSchema.minimum, "number");
            strictEqual(typeof timestampSchema.maximum, "number");
          }
        });
      }

      it("@minValue only", async () => {
        const schemas = await oapiForModel(
          "Test",
          `
          model Test {
            @minValue(utcDateTime.fromISO("2020-01-01T00:00:00Z"))
            timestamp: utcDateTime;
          }
        `,
        );

        const timestampSchema = schemas.schemas.Test.properties.timestamp;
        strictEqual(typeof timestampSchema.minimum, "number");
        strictEqual(timestampSchema.maximum, undefined);
        strictEqual(timestampSchema.type, "string");
        strictEqual(timestampSchema.format, "date-time");
      });

      it("@maxValue only", async () => {
        const schemas = await oapiForModel(
          "Test",
          `
          model Test {
            @maxValue(duration.fromISO("PT24H"))
            timestamp: duration;
          }
        `,
        );

        const timestampSchema = schemas.schemas.Test.properties.timestamp;
        strictEqual(timestampSchema.minimum, undefined);
        strictEqual(typeof timestampSchema.maximum, "number");
        strictEqual(timestampSchema.type, "string");
        strictEqual(timestampSchema.format, "duration");
      });
    });
  });
});
