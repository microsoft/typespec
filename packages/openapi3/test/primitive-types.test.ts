import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { OpenAPI3Schema } from "../src/types.js";
import { oapiForModel, openApiFor } from "./test-host.js";

describe("openapi3: primitives", () => {
  describe("handle TypeSpec intrinsic types", () => {
    const cases = [
      ["unknown", {}],
      ["null", { nullable: true }],
      ["numeric", { type: "number" }],
      ["integer", { type: "integer" }],
      ["int8", { type: "integer", format: "int8" }],
      ["int16", { type: "integer", format: "int16" }],
      ["int32", { type: "integer", format: "int32" }],
      ["int64", { type: "integer", format: "int64" }],
      ["safeint", { type: "integer", format: "int64" }],
      ["uint8", { type: "integer", format: "uint8" }],
      ["uint16", { type: "integer", format: "uint16" }],
      ["uint32", { type: "integer", format: "uint32" }],
      ["uint64", { type: "integer", format: "uint64" }],
      ["float", { type: "number" }],
      ["float32", { type: "number", format: "float" }],
      ["float64", { type: "number", format: "double" }],
      ["string", { type: "string" }],
      ["boolean", { type: "boolean" }],
      ["plainDate", { type: "string", format: "date" }],
      ["utcDateTime", { type: "string", format: "date-time" }],
      ["offsetDateTime", { type: "string", format: "date-time" }],
      ["plainTime", { type: "string", format: "time" }],
      ["duration", { type: "string", format: "duration" }],
      ["bytes", { type: "string", format: "byte" }],
      ["decimal", { type: "number", format: "decimal" }],
      ["decimal128", { type: "number", format: "decimal128" }],
    ];

    for (const [name, expectedSchema] of cases) {
      it(`handle type ${name}`, async () => {
        const res = await oapiForModel(
          "Pet",
          `
          model Pet { name: ${name} };
          `,
        );

        const schema = res.schemas.Pet.properties.name;
        deepStrictEqual(schema, expectedSchema);
      });
    }
  });

  describe("safeint-strategy", () => {
    it("produce type: integer, format: double-int for safeint when safeint-strategy is double-int", async () => {
      const res = await openApiFor(
        `
      model Pet { name: safeint };
      `,
        undefined,
        { "safeint-strategy": "double-int" },
      );

      const schema = res.components.schemas.Pet.properties.name;
      deepStrictEqual(schema, { type: "integer", format: "double-int" });
    });

    it("produce type: integer, format: int64 for safeint when safeint-strategy is int64", async () => {
      const res = await openApiFor(
        `
      model Pet { name: safeint };
      `,
        undefined,
        { "safeint-strategy": "int64" },
      );

      const schema = res.components.schemas.Pet.properties.name;
      deepStrictEqual(schema, { type: "integer", format: "int64" });
    });
  });

  it("defines models extended from primitives", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      scalar shortString extends string;
      model Pet { name: shortString };
      `,
    );

    ok(res.isRef);
    ok(res.schemas.shortString, "expected definition named shortString");
    ok(res.schemas.Pet, "expected definition named Pet");
    deepStrictEqual(res.schemas.shortString, {
      type: "string",
    });
  });

  describe("specify attributes on scalar is", () => {
    it("includes data passed on the model", async () => {
      const res = await oapiForModel(
        "Pet",
        `
      @maxLength(10) @minLength(10)
      scalar shortString extends string;
      model Pet { name: shortString };
      `,
      );

      ok(res.isRef);
      ok(res.schemas.shortString, "expected definition named shortString");
      ok(res.schemas.Pet, "expected definition named Pet");
      deepStrictEqual(res.schemas.shortString, {
        type: "string",
        minLength: 10,
        maxLength: 10,
      });
    });

    it("merge the data from parent", async () => {
      const res = await oapiForModel(
        "Pet",
        `
      @maxLength(10)
      scalar shortString extends string;
      @minLength(1)
      scalar shortButNotEmptyString extends shortString;
      model Pet { name: shortButNotEmptyString, breed: shortString };
      `,
      );
      ok(res.isRef);
      ok(res.schemas.shortString, "expected definition named shortString");
      ok(res.schemas.shortButNotEmptyString, "expected definition named shortButNotEmptyString");
      ok(res.schemas.Pet, "expected definition named Pet");

      deepStrictEqual(res.schemas.shortString, {
        type: "string",
        maxLength: 10,
      });
      deepStrictEqual(res.schemas.shortButNotEmptyString, {
        type: "string",
        minLength: 1,
        maxLength: 10,
      });
    });

    it("includes extensions passed on the model", async () => {
      const res = await oapiForModel(
        "Pet",
        `
      @extension("x-custom", "my-value")
      scalar Pet extends string;
      `,
      );

      ok(res.schemas.Pet, "expected definition named Pet");
      deepStrictEqual(res.schemas.Pet, {
        type: "string",
        "x-custom": "my-value",
      });
    });
  });

  describe("using @doc decorator", () => {
    it("apply description on extended scalar (string)", async () => {
      const res = await oapiForModel(
        "shortString",
        `
      @doc("My custom description")
      scalar shortString extends string;
      `,
      );

      ok(res.isRef);
      deepStrictEqual(res.schemas.shortString, {
        type: "string",
        description: "My custom description",
      });
    });

    it("apply description on extended scalar (int32)", async () => {
      const res = await oapiForModel(
        "specialint",
        `
      @doc("My custom description")
      scalar specialint extends int32;
      `,
      );

      ok(res.isRef);
      deepStrictEqual(res.schemas.specialint, {
        type: "integer",
        format: "int32",
        description: "My custom description",
      });
    });

    it("apply description on extended custom scalars", async () => {
      const res = await oapiForModel(
        "superSpecialint",
        `
      @doc("My custom description")
      scalar specialint extends int32;

      @doc("Override specialint description")
      scalar superSpecialint extends specialint;
      `,
      );

      ok(res.isRef);
      deepStrictEqual(res.schemas.superSpecialint, {
        type: "integer",
        format: "int32",
        description: "Override specialint description",
      });
    });
  });

  describe("using @secret decorator", () => {
    it("set format to 'password' when set on model", async () => {
      const res = await oapiForModel(
        "Pet",
        `
      @secret
      scalar Pet extends string;
      `,
      );
      deepStrictEqual(res.schemas.Pet, { type: "string", format: "password" });
    });

    it("set format to 'password' when set on model property", async () => {
      const res = await oapiForModel(
        "Pet",
        `
      model Pet {
        @secret
        foo: string;
      }

      op test(): Pet;
      `,
      );
      deepStrictEqual(res.schemas.Pet.properties.foo, {
        type: "string",
        format: "password",
      });
    });
  });

  it("supports summary on custom scalars", async () => {
    const res = await oapiForModel(
      "Foo",
      `
      @summary("FooScalar") scalar Foo extends string;
      `,
    );
    strictEqual(res.schemas.Foo.title, "FooScalar");
  });

  describe("using @encode decorator", () => {
    async function testEncode(
      scalar: string,
      expectedOpenApi: OpenAPI3Schema,
      encoding?: string | null,
      encodeAs?: string,
    ) {
      const encodeAsParam = encodeAs ? `, ${encodeAs}` : "";
      const encodeDecorator =
        encoding === null
          ? `@encode(${encodeAs})`
          : encoding !== undefined
            ? `@encode("${encoding}"${encodeAsParam})`
            : "";
      const res1 = await oapiForModel("s", `${encodeDecorator} scalar s extends ${scalar};`);
      deepStrictEqual(res1.schemas.s, expectedOpenApi);
      const res2 = await oapiForModel("Test", `model Test {${encodeDecorator} prop: ${scalar}};`);
      deepStrictEqual(res2.schemas.Test.properties.prop, expectedOpenApi);
    }

    describe("utcDateTime", () => {
      it("set format to 'date-time' by default", () =>
        testEncode("utcDateTime", { type: "string", format: "date-time" }));
      it("set format to 'date-time-rfc7231' when encoding is rfc7231", () =>
        testEncode("utcDateTime", { type: "string", format: "http-date" }, "rfc7231"));
      it("set format to 'http-date' when encoding is http-date", () =>
        testEncode("utcDateTime", { type: "string", format: "http-date" }, "http-date"));
      it("set type to integer and format to 'unixtime' when encoding is unixTimestamp (unixTimestamp info is lost)", async () => {
        const expected: OpenAPI3Schema = { type: "integer", format: "unixtime" };
        await testEncode("utcDateTime", expected, "unixTimestamp", "integer");
        await testEncode("utcDateTime", expected, "unixTimestamp", "int32");
        await testEncode("utcDateTime", expected, "unixTimestamp", "int64");
        await testEncode("utcDateTime", expected, "unixTimestamp", "int8");
        await testEncode("utcDateTime", expected, "unixTimestamp", "uint8");
      });
    });

    describe("offsetDateTime", () => {
      it("set format to 'date-time' by default", () =>
        testEncode("offsetDateTime", { type: "string", format: "date-time" }));
      it("set format to 'date-time-rfc7231' when encoding is rfc7231", () =>
        testEncode("offsetDateTime", { type: "string", format: "http-date" }, "rfc7231"));
      it("set format to 'http-date' when encoding is http-date", () =>
        testEncode("offsetDateTime", { type: "string", format: "http-date" }, "http-date"));
    });

    describe("duration", () => {
      it("set format to 'duration' by default", () =>
        testEncode("duration", { type: "string", format: "duration" }));
      it("set integer with int32 format setting duration as seconds", () =>
        testEncode("duration", { type: "integer", format: "int32" }, "seconds", "int32"));
    });

    describe("bytes", () => {
      it("set format to 'base64' by default", () =>
        testEncode("bytes", { type: "string", format: "byte" }));
      it("set format to base64url when encoding bytes as base64url", () =>
        testEncode("bytes", { type: "string", format: "base64url" }, "base64url"));
    });

    describe("int64", () => {
      it("set type: integer and format to 'int64' by default", () =>
        testEncode("int64", { type: "integer", format: "int64" }));
      it("set type: string and format to int64 when @encode(string)", () =>
        testEncode("int64", { type: "string", format: "int64" }, null, "string"));
    });

    describe("decimal128", () => {
      it("set type: integer and format to 'int64' by default", () =>
        testEncode("decimal128", { type: "number", format: "decimal128" }));
      it("set type: string and format to int64 when @encode(string)", () =>
        testEncode("decimal128", { type: "string", format: "decimal128" }, null, "string"));
    });
  });
});
