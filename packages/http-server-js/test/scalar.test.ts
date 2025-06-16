import { ModelProperty, NoTarget, Scalar } from "@typespec/compiler";
import { BasicTestRunner, createTestRunner } from "@typespec/compiler/testing";
import { deepStrictEqual, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { getJsScalar } from "../src/common/scalar.js";
import { createPathCursor, JsContext, Module } from "../src/ctx.js";

import { module as dateTimeModule } from "../generated-defs/helpers/datetime.js";
import { module as temporalHelpersModule } from "../generated-defs/helpers/temporal/native.js";
import { module as temporalPolyfillHelpersModule } from "../generated-defs/helpers/temporal/polyfill.js";
import { JsEmitterOptions } from "../src/lib.js";

describe("scalar", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTestRunner();
  });

  function createFakeModule(options?: JsEmitterOptions): [JsContext, Module] {
    const module: Module = {
      name: "example",
      cursor: createPathCursor(),

      imports: [],
      declarations: [],
    };

    // Min context
    const ctx: JsContext = {
      program: runner.program,
      rootModule: module,
      options: options ?? {},
    } as JsContext;

    return [ctx, module];
  }

  async function getScalar(...names: string[]): Promise<Scalar[]> {
    const { test } = (await runner.compile(`
      model Example {
        @test test: [${names.join(", ")}];
      }
    `)) as { test: ModelProperty };

    if (test.type.kind !== "Tuple") {
      throw new Error("Expected tuple type");
    }

    if (!test.type.values.every((t) => t.kind === "Scalar")) {
      throw new Error("Expected scalar types only");
    }

    return test.type.values as Scalar[];
  }

  it("has no-op encoding for string", async () => {
    const [string] = await getScalar("TypeSpec.string");

    const [ctx, mod] = createFakeModule();

    const jsScalar = getJsScalar(ctx, mod, string, NoTarget);

    strictEqual(jsScalar.type, "string");
    strictEqual(jsScalar.getEncoding("default", string)?.encode("asdf"), "(asdf)");
    strictEqual(mod.imports.length, 0);
  });

  it("correctly encodes and decodes all numbers using default string encoding", async () => {
    const [string, ...numbers] = await getScalar(
      "string",
      "float32",
      "float64",
      "int8",
      "int16",
      "int32",
      "uint8",
      "uint16",
      "uint32",
      "safeint",
    );

    const [ctx, mod] = createFakeModule();

    for (const number of numbers) {
      const jsScalar = getJsScalar(ctx, mod, number, NoTarget);

      strictEqual(jsScalar.type, "number");

      const encoding = jsScalar.getEncoding("default", string);

      if (!encoding) {
        throw new Error("Expected default encoding");
      }

      const encoded = encoding.encode("asdf");

      strictEqual(encoded, "globalThis.String((asdf))");

      const decoded = encoding.decode("asdf");

      strictEqual(decoded, "globalThis.Number((asdf))");
    }
  });

  it("encodes and decodes types that coerce to bigint using default string encoding", async () => {
    const [string, ...bigints] = await getScalar("string", "uint64", "int64", "integer");

    const [ctx, mod] = createFakeModule();

    for (const bigint of bigints) {
      const jsScalar = getJsScalar(ctx, mod, bigint, NoTarget);

      strictEqual(jsScalar.type, "bigint");

      const encoding = jsScalar.getEncoding("default", string);

      if (!encoding) {
        throw new Error("Expected default encoding");
      }

      const encoded = encoding.encode("asdf");

      strictEqual(encoded, "globalThis.String((asdf))");

      const decoded = encoding.decode("asdf");

      strictEqual(decoded, "globalThis.BigInt((asdf))");
    }
  });

  it("bytes base64 encoding", async () => {
    const [string, bytes] = await getScalar("TypeSpec.string", "TypeSpec.bytes");

    const [ctx, mod] = createFakeModule();

    const jsScalar = getJsScalar(ctx, mod, bytes, NoTarget);

    strictEqual(jsScalar.type, "Uint8Array");

    const encoding = jsScalar.getEncoding("base64", string);

    if (!encoding) {
      throw new Error("Expected base64 encoding");
    }

    const encoded = encoding.encode("asdf");

    strictEqual(
      encoded,
      "((asdf) instanceof globalThis.Buffer ? (asdf) : globalThis.Buffer.from((asdf))).toString('base64')",
    );

    const decoded = encoding.decode("asdf");

    strictEqual(decoded, "globalThis.Buffer.from((asdf), 'base64')");
  });

  it("bytes base64url encoding", async () => {
    const [string, bytes] = await getScalar("TypeSpec.string", "TypeSpec.bytes");

    const [ctx, mod] = createFakeModule();

    const jsScalar = getJsScalar(ctx, mod, bytes, NoTarget);

    strictEqual(jsScalar.type, "Uint8Array");

    const encoding = jsScalar.getEncoding("base64url", string);

    if (!encoding) {
      throw new Error("Expected base64url encoding");
    }

    const encoded = encoding.encode("asdf");

    strictEqual(
      encoded,
      "globalThis.encodeURIComponent((((asdf)) instanceof globalThis.Buffer ? ((asdf)) : globalThis.Buffer.from(((asdf)))).toString('base64'))",
    );

    const decoded = encoding.decode("asdf");

    strictEqual(
      decoded,
      "globalThis.Buffer.from((globalThis.decodeURIComponent((asdf))), 'base64')",
    );
  });

  describe("date/time/duration types", () => {
    describe("mode: temporal", () => {
      const options: JsEmitterOptions = {
        "no-format": false,
        "omit-unreachable-types": false,
        express: false,
        datetime: "temporal",
      };

      describe("date", () => {
        it("produces correct parse template for ISO8601 utcDateTime", async () => {
          const [utcDateTime, string] = await getScalar("TypeSpec.utcDateTime", "TypeSpec.string");

          const [ctx, mod] = createFakeModule(options);

          const jsScalar = getJsScalar(ctx, mod, utcDateTime, NoTarget);

          strictEqual(jsScalar.type, "Temporal.Instant");
          strictEqual(
            jsScalar.getEncoding("iso8601", string)?.decode("asdf"),
            "globalThis.Temporal.Instant.from((asdf))",
          );
          deepStrictEqual(mod.imports, []);
        });

        it("produces correct write template for ISO8601 utcDateTime", async () => {
          const [utcDateTime, string] = await getScalar("TypeSpec.utcDateTime", "TypeSpec.string");

          const [ctx, mod] = createFakeModule(options);

          const jsScalar = getJsScalar(ctx, mod, utcDateTime, NoTarget);

          strictEqual(jsScalar.type, "Temporal.Instant");
          strictEqual(
            jsScalar.getEncoding("iso8601", string)?.encode("asdf"),
            "((asdf)).toString()",
          );
          deepStrictEqual(mod.imports, []);
        });

        it("allows default string encoding through via", async () => {
          const [utcDateTime, string] = await getScalar("utcDateTime", "string");

          const [ctx, mod] = createFakeModule(options);

          const jsScalar = getJsScalar(ctx, mod, utcDateTime, NoTarget);

          strictEqual(jsScalar.type, "Temporal.Instant");

          const encoding = jsScalar.getEncoding("default", string);

          if (!encoding) {
            throw new Error("Expected default encoding");
          }

          const encoded = encoding.encode("asdf");

          strictEqual(encoded, "(((asdf))).toString()");

          const decoded = encoding.decode("asdf");

          strictEqual(decoded, "globalThis.Temporal.Instant.from(((asdf)))");
        });

        it("transcodes to rfc7231", async () => {
          const [utcDateTime, string] = await getScalar("TypeSpec.utcDateTime", "TypeSpec.string");
          const [ctx, mod] = createFakeModule(options);
          const jsScalar = getJsScalar(ctx, mod, utcDateTime, NoTarget);
          strictEqual(jsScalar.type, "Temporal.Instant");
          const encoding = jsScalar.getEncoding("rfc7231", string);
          if (!encoding) {
            throw new Error("Expected rfc7231 encoding");
          }
          const encoded = encoding.encode("asdf");
          strictEqual(encoded, "formatHttpDate((asdf))");
          const decoded = encoding.decode("asdf");
          strictEqual(decoded, "parseHttpDate((asdf))");
          strictEqual(mod.imports[0].from, temporalHelpersModule);
          deepStrictEqual(mod.imports[0].binder, ["formatHttpDate"]);
          strictEqual(mod.imports[1].from, temporalHelpersModule);
          deepStrictEqual(mod.imports[1].binder, ["parseHttpDate"]);
        });

        describe("ZonedDateTime", () => {
          // Same as above, but with TypeSpec.offsetDateTime represented as Temporal.ZonedDateTime

          it("produces correct parse template for ISO8601 offsetDateTime", async () => {
            const [offsetDateTime, string] = await getScalar(
              "TypeSpec.offsetDateTime",
              "TypeSpec.string",
            );

            const [ctx, mod] = createFakeModule(options);

            const jsScalar = getJsScalar(ctx, mod, offsetDateTime, NoTarget);

            strictEqual(jsScalar.type, "Temporal.ZonedDateTime");
            strictEqual(
              jsScalar.getEncoding("iso8601", string)?.decode("asdf"),
              "globalThis.Temporal.ZonedDateTime.from((asdf))",
            );
            deepStrictEqual(mod.imports, []);
          });

          it("produces correct write template for ISO8601 offsetDateTime", async () => {
            const [offsetDateTime, string] = await getScalar(
              "TypeSpec.offsetDateTime",
              "TypeSpec.string",
            );

            const [ctx, mod] = createFakeModule(options);

            const jsScalar = getJsScalar(ctx, mod, offsetDateTime, NoTarget);

            strictEqual(jsScalar.type, "Temporal.ZonedDateTime");
            strictEqual(
              jsScalar.getEncoding("iso8601", string)?.encode("asdf"),
              "((asdf)).toString()",
            );
            deepStrictEqual(mod.imports, []);
          });

          it("allows default string encoding through via", async () => {
            const [offsetDateTime, string] = await getScalar("offsetDateTime", "string");

            const [ctx, mod] = createFakeModule(options);

            const jsScalar = getJsScalar(ctx, mod, offsetDateTime, NoTarget);

            strictEqual(jsScalar.type, "Temporal.ZonedDateTime");

            const encoding = jsScalar.getEncoding("default", string);

            if (!encoding) {
              throw new Error("Expected default encoding");
            }

            const encoded = encoding.encode("asdf");

            strictEqual(encoded, "(((asdf))).toString()");

            const decoded = encoding.decode("asdf");

            strictEqual(decoded, "globalThis.Temporal.ZonedDateTime.from(((asdf)))");
          });

          it("transcodes to rfc7231", async () => {
            const [offsetDateTime, string] = await getScalar(
              "TypeSpec.offsetDateTime",
              "TypeSpec.string",
            );

            const [ctx, mod] = createFakeModule(options);

            const jsScalar = getJsScalar(ctx, mod, offsetDateTime, NoTarget);

            strictEqual(jsScalar.type, "Temporal.ZonedDateTime");

            const encoding = jsScalar.getEncoding("rfc7231", string);

            if (!encoding) {
              throw new Error("Expected rfc7231 encoding");
            }

            const encoded = encoding.encode("asdf");

            strictEqual(encoded, "formatHttpDate(((asdf)).toInstant())");

            const decoded = encoding.decode("asdf");

            strictEqual(decoded, 'parseHttpDate((asdf)).toZonedDateTimeISO("UTC")');

            strictEqual(mod.imports[0].from, temporalHelpersModule);
            deepStrictEqual(mod.imports[0].binder, ["formatHttpDate"]);
            strictEqual(mod.imports[1].from, temporalHelpersModule);
            deepStrictEqual(mod.imports[1].binder, ["parseHttpDate"]);
          });
        });
      });
    });

    describe("mode: temporal-polyfill", () => {
      const options: JsEmitterOptions = {
        "no-format": false,
        "omit-unreachable-types": false,
        express: false,
        datetime: "temporal-polyfill",
      };

      describe("date", () => {
        it("produces correct parse template for ISO8601 utcDateTime", async () => {
          const [utcDateTime, string] = await getScalar("TypeSpec.utcDateTime", "TypeSpec.string");

          const [ctx, mod] = createFakeModule(options);

          const jsScalar = getJsScalar(ctx, mod, utcDateTime, NoTarget);

          strictEqual(jsScalar.type, "Temporal.Instant");
          strictEqual(
            jsScalar.getEncoding("iso8601", string)?.decode("asdf"),
            "Temporal.Instant.from((asdf))",
          );
          strictEqual(mod.imports[0].from, "temporal-polyfill");
          deepStrictEqual(mod.imports[0].binder, ["Temporal"]);
        });

        it("produces correct write template for ISO8601 utcDateTime", async () => {
          const [utcDateTime, string] = await getScalar("TypeSpec.utcDateTime", "TypeSpec.string");

          const [ctx, mod] = createFakeModule(options);

          const jsScalar = getJsScalar(ctx, mod, utcDateTime, NoTarget);

          strictEqual(jsScalar.type, "Temporal.Instant");
          strictEqual(
            jsScalar.getEncoding("iso8601", string)?.encode("asdf"),
            "((asdf)).toString()",
          );
          strictEqual(mod.imports[0].from, "temporal-polyfill");
          deepStrictEqual(mod.imports[0].binder, ["Temporal"]);
        });

        it("allows default string encoding through via", async () => {
          const [utcDateTime, string] = await getScalar("utcDateTime", "string");

          const [ctx, mod] = createFakeModule(options);

          const jsScalar = getJsScalar(ctx, mod, utcDateTime, NoTarget);

          strictEqual(jsScalar.type, "Temporal.Instant");

          const encoding = jsScalar.getEncoding("default", string);

          if (!encoding) {
            throw new Error("Expected default encoding");
          }

          const encoded = encoding.encode("asdf");

          strictEqual(encoded, "(((asdf))).toString()");

          const decoded = encoding.decode("asdf");

          strictEqual(decoded, "Temporal.Instant.from(((asdf)))");
        });

        it("transcodes to rfc7231", async () => {
          const [utcDateTime, string] = await getScalar("TypeSpec.utcDateTime", "TypeSpec.string");
          const [ctx, mod] = createFakeModule(options);
          const jsScalar = getJsScalar(ctx, mod, utcDateTime, NoTarget);
          strictEqual(jsScalar.type, "Temporal.Instant");
          const encoding = jsScalar.getEncoding("rfc7231", string);
          if (!encoding) {
            throw new Error("Expected rfc7231 encoding");
          }
          const encoded = encoding.encode("asdf");
          strictEqual(encoded, "formatHttpDate((asdf))");
          const decoded = encoding.decode("asdf");
          strictEqual(decoded, "parseHttpDate((asdf))");
          strictEqual(mod.imports[0].from, "temporal-polyfill");
          deepStrictEqual(mod.imports[0].binder, ["Temporal"]);
          strictEqual(mod.imports[1].from, temporalPolyfillHelpersModule);
          deepStrictEqual(mod.imports[1].binder, ["formatHttpDate"]);
          strictEqual(mod.imports[2].from, temporalPolyfillHelpersModule);
          deepStrictEqual(mod.imports[2].binder, ["parseHttpDate"]);
        });

        describe("ZonedDateTime", () => {
          // Same as above, but with TypeSpec.offsetDateTime represented as Temporal.ZonedDateTime

          it("produces correct parse template for ISO8601 offsetDateTime", async () => {
            const [offsetDateTime, string] = await getScalar(
              "TypeSpec.offsetDateTime",
              "TypeSpec.string",
            );

            const [ctx, mod] = createFakeModule(options);

            const jsScalar = getJsScalar(ctx, mod, offsetDateTime, NoTarget);

            strictEqual(jsScalar.type, "Temporal.ZonedDateTime");
            strictEqual(
              jsScalar.getEncoding("iso8601", string)?.decode("asdf"),
              "Temporal.ZonedDateTime.from((asdf))",
            );
            strictEqual(mod.imports[0].from, "temporal-polyfill");
            deepStrictEqual(mod.imports[0].binder, ["Temporal"]);
          });

          it("produces correct write template for ISO8601 offsetDateTime", async () => {
            const [offsetDateTime, string] = await getScalar(
              "TypeSpec.offsetDateTime",
              "TypeSpec.string",
            );

            const [ctx, mod] = createFakeModule(options);

            const jsScalar = getJsScalar(ctx, mod, offsetDateTime, NoTarget);

            strictEqual(jsScalar.type, "Temporal.ZonedDateTime");
            strictEqual(
              jsScalar.getEncoding("iso8601", string)?.encode("asdf"),
              "((asdf)).toString()",
            );
            strictEqual(mod.imports[0].from, "temporal-polyfill");
            deepStrictEqual(mod.imports[0].binder, ["Temporal"]);
          });

          it("allows default string encoding through via", async () => {
            const [offsetDateTime, string] = await getScalar("offsetDateTime", "string");

            const [ctx, mod] = createFakeModule(options);

            const jsScalar = getJsScalar(ctx, mod, offsetDateTime, NoTarget);

            strictEqual(jsScalar.type, "Temporal.ZonedDateTime");

            const encoding = jsScalar.getEncoding("default", string);

            if (!encoding) {
              throw new Error("Expected default encoding");
            }

            const encoded = encoding.encode("asdf");

            strictEqual(encoded, "(((asdf))).toString()");

            const decoded = encoding.decode("asdf");

            strictEqual(decoded, "Temporal.ZonedDateTime.from(((asdf)))");
          });

          it("transcodes to rfc7231", async () => {
            const [offsetDateTime, string] = await getScalar(
              "TypeSpec.offsetDateTime",
              "TypeSpec.string",
            );
            const [ctx, mod] = createFakeModule(options);
            const jsScalar = getJsScalar(ctx, mod, offsetDateTime, NoTarget);
            strictEqual(jsScalar.type, "Temporal.ZonedDateTime");
            const encoding = jsScalar.getEncoding("rfc7231", string);
            if (!encoding) {
              throw new Error("Expected rfc7231 encoding");
            }
            const encoded = encoding.encode("asdf");
            strictEqual(encoded, "formatHttpDate(((asdf)).toInstant())");
            const decoded = encoding.decode("asdf");
            strictEqual(decoded, 'parseHttpDate((asdf)).toZonedDateTimeISO("UTC")');
            strictEqual(mod.imports[0].from, "temporal-polyfill");
            deepStrictEqual(mod.imports[0].binder, ["Temporal"]);
            strictEqual(mod.imports[1].from, temporalPolyfillHelpersModule);
            deepStrictEqual(mod.imports[1].binder, ["formatHttpDate"]);
            strictEqual(mod.imports[2].from, temporalPolyfillHelpersModule);
            deepStrictEqual(mod.imports[2].binder, ["parseHttpDate"]);
          });
        });
      });
    });

    describe("mode: date-duration", () => {
      const options: JsEmitterOptions = {
        "no-format": false,
        "omit-unreachable-types": false,
        express: false,
        datetime: "date-duration",
      };

      describe("date", () => {
        it("produces correct parse template for ISO8601 utcDateTime", async () => {
          const [utcDateTime, string] = await getScalar("TypeSpec.utcDateTime", "TypeSpec.string");

          const [ctx, mod] = createFakeModule(options);

          const jsScalar = getJsScalar(ctx, mod, utcDateTime, NoTarget);

          strictEqual(jsScalar.type, "Date");
          strictEqual(
            jsScalar.getEncoding("iso8601", string)?.decode("asdf"),
            "new globalThis.Date((asdf))",
          );
          deepStrictEqual(mod.imports, []);
        });

        it("produces correct write template for ISO8601 utcDateTime", async () => {
          const [utcDateTime, string] = await getScalar("TypeSpec.utcDateTime", "TypeSpec.string");

          const [ctx, mod] = createFakeModule(options);

          const jsScalar = getJsScalar(ctx, mod, utcDateTime, NoTarget);

          strictEqual(jsScalar.type, "Date");
          strictEqual(
            jsScalar.getEncoding("iso8601", string)?.encode("asdf"),
            "((asdf)).toISOString()",
          );
          deepStrictEqual(mod.imports, []);
        });

        it("allows default string encoding through via", async () => {
          const [utcDateTime, string] = await getScalar("utcDateTime", "string");

          const [ctx, mod] = createFakeModule(options);

          const jsScalar = getJsScalar(ctx, mod, utcDateTime, NoTarget);

          strictEqual(jsScalar.type, "Date");

          const encoding = jsScalar.getEncoding("default", string);

          if (!encoding) {
            throw new Error("Expected default encoding");
          }

          const encoded = encoding.encode("asdf");

          strictEqual(encoded, "(((asdf))).toISOString()");

          const decoded = encoding.decode("asdf");

          strictEqual(decoded, "new globalThis.Date(((asdf)))");
        });

        it("correctly encodes and decodes rfc7231 date", async () => {
          const [utcDateTime, string] = await getScalar("TypeSpec.utcDateTime", "TypeSpec.string");

          const [ctx, mod] = createFakeModule(options);

          const jsScalar = getJsScalar(ctx, mod, utcDateTime, NoTarget);

          strictEqual(jsScalar.type, "Date");

          const encoding = jsScalar.getEncoding("rfc7231", string);
          if (!encoding) {
            throw new Error("Expected rfc7231 encoding");
          }

          const encoded = encoding.encode("asdf");
          strictEqual(encoded, "((asdf)).toUTCString()");
          const decoded = encoding.decode("asdf");
          strictEqual(decoded, "new globalThis.Date((asdf))");
          deepStrictEqual(mod.imports, []);
        });
      });

      describe("duration", () => {
        it("produces correct parse template for ISO8601 duration", async () => {
          const [Duration, string] = await getScalar("TypeSpec.duration", "TypeSpec.string");

          const [ctx, mod] = createFakeModule(options);

          const jsScalar = getJsScalar(ctx, mod, Duration, NoTarget);

          strictEqual(jsScalar.type, "Duration");
          strictEqual(
            jsScalar.getEncoding("ISO8601", string)?.decode("asdf"),
            "Duration.parseISO8601((asdf))",
          );
          strictEqual(mod.imports[0].from, dateTimeModule);
          deepStrictEqual(mod.imports[0].binder, ["Duration"]);
        });

        it("produces correct write template for ISO8601 duration", async () => {
          const [Duration, string] = await getScalar("TypeSpec.duration", "TypeSpec.string");

          const [ctx, mod] = createFakeModule(options);

          const jsScalar = getJsScalar(ctx, mod, Duration, NoTarget);

          strictEqual(jsScalar.type, "Duration");
          strictEqual(
            jsScalar.getEncoding("ISO8601", string)?.encode("asdf"),
            "Duration.toISO8601((asdf))",
          );
          strictEqual(mod.imports[0].from, dateTimeModule);
          deepStrictEqual(mod.imports[0].binder, ["Duration"]);
        });

        it("can parse and write ISO8601 duration", async () => {
          const [Duration, string] = await getScalar("TypeSpec.duration", "TypeSpec.string");

          const [ctx, mod] = createFakeModule(options);

          const jsScalar = getJsScalar(ctx, mod, Duration, NoTarget);

          strictEqual(jsScalar.type, "Duration");

          const encoding = jsScalar.getEncoding("ISO8601", string);

          if (!encoding) {
            throw new Error("Expected ISO8601 encoding");
          }

          const encoded = encoding.encode("duration");

          strictEqual(encoded, "Duration.toISO8601((duration))");

          const decoded = encoding.decode('"P1Y2M3DT4H5M6S"');

          strictEqual(decoded, 'Duration.parseISO8601(("P1Y2M3DT4H5M6S"))');

          strictEqual(mod.imports[0].from, dateTimeModule);
          deepStrictEqual(mod.imports[0].binder, ["Duration"]);
        });

        it("allows default string encoding through via", async () => {
          const [Duration, string] = await getScalar("duration", "string");

          const [ctx, mod] = createFakeModule(options);

          const jsScalar = getJsScalar(ctx, mod, Duration, NoTarget);

          strictEqual(jsScalar.type, "Duration");

          const encoding = jsScalar.getEncoding("default", string);

          if (!encoding) {
            throw new Error("Expected default encoding");
          }

          const encoded = encoding.encode("duration");

          strictEqual(encoded, "Duration.toISO8601(((duration)))");

          const decoded = encoding.decode("duration");

          strictEqual(decoded, "Duration.parseISO8601(((duration)))");
        });

        it("allows encoding seconds to number types", async () => {
          const [Duration, int32, uint32] = await getScalar("duration", "int32", "uint32");

          const [ctx, mod] = createFakeModule(options);

          const jsScalar = getJsScalar(ctx, mod, Duration, NoTarget);

          strictEqual(jsScalar.type, "Duration");

          const encodingInt32 = jsScalar.getEncoding("seconds", int32);

          if (!encodingInt32) {
            throw new Error("Expected seconds encoding int32");
          }

          const encodedInt32 = encodingInt32.encode("duration");

          strictEqual(encodedInt32, "Duration.totalSeconds((duration))");

          const decodedInt32 = encodingInt32.decode("duration");

          strictEqual(decodedInt32, "Duration.fromTotalSeconds((duration))");

          const encodingUint32 = jsScalar.getEncoding("seconds", uint32);

          if (!encodingUint32) {
            throw new Error("Expected seconds encoding uint32");
          }

          const encodedUint32 = encodingUint32.encode("duration");

          strictEqual(encodedUint32, "Duration.totalSeconds((duration))");

          const decodedUint32 = encodingUint32.decode("duration");

          strictEqual(decodedUint32, "Duration.fromTotalSeconds((duration))");
        });

        it("allows encoding seconds to bigint types", async () => {
          const [Duration, int64, uint64] = await getScalar("duration", "int64", "uint64");

          const [ctx, mod] = createFakeModule(options);

          const jsScalar = getJsScalar(ctx, mod, Duration, NoTarget);

          strictEqual(jsScalar.type, "Duration");

          const encodingInt64 = jsScalar.getEncoding("seconds", int64);

          if (!encodingInt64) {
            throw new Error("Expected seconds encoding int64");
          }

          const encodedInt64 = encodingInt64.encode("duration");

          strictEqual(encodedInt64, "Duration.totalSecondsBigInt((duration))");

          const decodedInt64 = encodingInt64.decode("duration");

          strictEqual(decodedInt64, "Duration.fromTotalSeconds(globalThis.Number((duration)))");

          const encodingUint64 = jsScalar.getEncoding("seconds", uint64);

          if (!encodingUint64) {
            throw new Error("Expected seconds encoding uint64");
          }

          const encodedUint64 = encodingUint64.encode("duration");

          strictEqual(encodedUint64, "Duration.totalSecondsBigInt((duration))");

          const decodedUint64 = encodingUint64.decode("duration");

          strictEqual(decodedUint64, "Duration.fromTotalSeconds(globalThis.Number((duration)))");
        });
      });
    });
  });
});
