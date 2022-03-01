import { deepStrictEqual, ok } from "assert";
import { oapiForModel } from "./test-host.js";

describe("openapi3: primitives", () => {
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

  it("apply description on extended primitive", async () => {
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

  it("defines models extended from primitives with attrs", async () => {
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

  it("defines models extended from primitives with new attrs", async () => {
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
