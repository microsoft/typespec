import { deepStrictEqual, ok } from "assert";
import { oapiForModel } from "./test-host.js";

describe("openapi3: primitives", () => {
  describe("handle cadl intrinsic types", () => {
    const cases = [
      ["int8", { type: "integer", format: "int8" }],
      ["int16", { type: "integer", format: "int16" }],
      ["int32", { type: "integer", format: "int32" }],
      ["int64", { type: "integer", format: "int64" }],
      ["safeint", { type: "integer", format: "int64" }],
      ["uint8", { type: "integer", format: "uint8" }],
      ["uint16", { type: "integer", format: "uint16" }],
      ["uint32", { type: "integer", format: "uint32" }],
      ["uint64", { type: "integer", format: "uint64" }],
      ["float32", { type: "number", format: "float" }],
      ["float64", { type: "number", format: "double" }],
      ["string", { type: "string" }],
      ["boolean", { type: "boolean" }],
      ["plainDate", { type: "string", format: "date" }],
      ["zonedDateTime", { type: "string", format: "date-time" }],
      ["plainTime", { type: "string", format: "time" }],
      ["duration", { type: "string", format: "duration" }],
      ["bytes", { type: "string", format: "byte" }],
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
      model shortString is string {}
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

  describe("specify attributes on model is", () => {
    it("includes data passed on the model", async () => {
      const res = await oapiForModel(
        "Pet",
        `
      @maxLength(10) @minLength(10)
      model shortString is string {}
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
      model shortString is string {}
      @minLength(1)
      model shortButNotEmptyString is shortString {};
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
  });

  describe("using @doc decorator", () => {
    it("apply description on extended primitive (string)", async () => {
      const res = await oapiForModel(
        "shortString",
        `
      @doc("My custom description")
      model shortString is string {}
      `
      );

      ok(res.isRef);
      ok(res.schemas.shortString, "expected definition named shortString");
      deepStrictEqual(res.schemas.shortString, {
        type: "string",
        description: "My custom description",
      });
    });

    it("apply description on extended primitive (int32)", async () => {
      const res = await oapiForModel(
        "specialint",
        `
      @doc("My custom description")
      model specialint is int32 {}
      `
      );

      ok(res.isRef);
      ok(res.schemas.specialint, "expected definition named shortString");
      deepStrictEqual(res.schemas.specialint, {
        type: "integer",
        format: "int32",
        description: "My custom description",
      });
    });
  });

  describe("using @secret decorator", () => {
    it("set format to 'password' when set on model", async () => {
      const res = await oapiForModel(
        "Pet",
        `
      @secret
      model Pet is string;
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
});
