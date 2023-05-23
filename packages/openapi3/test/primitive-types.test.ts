import { deepStrictEqual, ok } from "assert";
import { OpenAPI3Schema } from "../src/types.js";
import { oapiForModel } from "./test-host.js";

describe("openapi3: primitives", () => {
  describe("handle typespec intrinsic types", () => {
    const cases = [
      ["unknown", {}],
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
      ["decimal", { type: "string", format: "decimal" }],
      ["decimal128", { type: "string", format: "decimal128" }],
    ];

    for (const [name, expectedSchema] of cases) {
      it(`handle type ${name}`, async () => {
        const res = await oapiForModel(
          "Pet",
          `
          model Pet { name: ${name} };
          `
        );

        const schema = res.schemas.Pet.properties.name;
        deepStrictEqual(schema, expectedSchema);
      });
    }
  });

  it("defines models extended from primitives", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      scalar shortString extends string;
      model Pet { name: shortString };
      `
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
      `
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
      `
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
      `
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
      `
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
      `
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
      `
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
      `
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
      `
      );
      deepStrictEqual(res.schemas.Pet.properties.foo, {
        type: "string",
        format: "password",
      });
    });
  });

  describe("using @encode decorator", () => {
    async function testEncode(
      scalar: string,
      expectedOpenApi: OpenAPI3Schema,
      encoding?: string,
      encodeAs?: string
    ) {
      const encodeAsParam = encodeAs ? `, ${encodeAs}` : "";
      const encodeDecorator = encoding ? `@encode("${encoding}"${encodeAsParam})` : "";
      const res = await oapiForModel("s", `${encodeDecorator} scalar s extends ${scalar};`);
      deepStrictEqual(res.schemas.s, expectedOpenApi);
    }

    describe("utcDateTime", () => {
      it("set format to 'date-time' by default", () =>
        testEncode("utcDateTime", { type: "string", format: "date-time" }));
      it("set format to 'date-time-rfc7231' when encoding is rfc7231", () =>
        testEncode("utcDateTime", { type: "string", format: "date-time-rfc7231" }, "rfc7231"));

      it("set type to integer and format to 'unixTimeStamp' when encoding is unixTimestamp", () =>
        testEncode(
          "utcDateTime",
          { type: "integer", format: "unix-timestamp" },
          "unixTimestamp",
          "int32"
        ));
    });

    describe("offsetDateTime", () => {
      it("set format to 'date-time' by default", () =>
        testEncode("offsetDateTime", { type: "string", format: "date-time" }));
      it("set format to 'date-time-rfc7231' when encoding is rfc7231", () =>
        testEncode("offsetDateTime", { type: "string", format: "date-time-rfc7231" }, "rfc7231"));
    });

    describe("duration", () => {
      it("set format to 'duration' by default", () =>
        testEncode("duration", { type: "string", format: "duration" }));
      it("set interger with seconds format setting duration as seconds", () =>
        testEncode("duration", { type: "integer", format: "seconds" }, "seconds", "int32"));
    });

    describe("bytes", () => {
      it("set format to 'base64' by default", () =>
        testEncode("bytes", { type: "string", format: "byte" }));
      it("set interger with seconds format setting duration as seconds", () =>
        testEncode("bytes", { type: "string", format: "base64url" }, "base64url"));
    });
  });
});
