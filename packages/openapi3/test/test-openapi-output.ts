import { deepStrictEqual, match, ok, strictEqual } from "assert";
import { createOpenAPITestHost, openApiFor } from "./testHost.js";

describe("openapi3: definitions", () => {
  it("defines models", async () => {
    const res = await oapiForModel(
      "Foo",
      `model Foo {
        x: int32;
      };`
    );

    ok(res.isRef);
    deepStrictEqual(res.schemas.Foo, {
      type: "object",
      properties: {
        x: { type: "integer", format: "int32" },
      },
      required: ["x"],
    });
  });

  it("doesn't define anonymous or unconnected models", async () => {
    const res = await oapiForModel(
      "{ ... Foo }",
      `model Foo {
        x: int32;
      };`
    );

    ok(!res.isRef);
    strictEqual(Object.keys(res.schemas).length, 0);
    deepStrictEqual(res.useSchema, {
      type: "object",
      properties: {
        x: { type: "integer", format: "int32" },
      },
      required: ["x"],
      "x-cadl-name": "(anonymous model)",
    });
  });

  it("defines templated models", async () => {
    const res = await oapiForModel(
      "Foo<int32>",
      `model Foo<T> {
        x: T;
      };`
    );

    ok(res.isRef);
    ok(res.schemas.Foo_int32, "expected definition named Foo_int32");
    deepStrictEqual(res.schemas.Foo_int32, {
      type: "object",
      properties: {
        x: { type: "integer", format: "int32" },
      },
      required: ["x"],
    });
  });

  it("defines templated models when template param is in a namespace", async () => {
    const res = await oapiForModel(
      "Foo<Test.M>",
      `
      namespace Test {
        model M {}
      }
      model Foo<T> {
        x: T;
      };`
    );

    ok(res.isRef);
    ok(res.schemas["Foo_Test.M"], "expected definition named Foo_Test.M");
    deepStrictEqual(res.schemas["Foo_Test.M"], {
      type: "object",
      properties: {
        x: { $ref: "#/components/schemas/Test.M" },
      },
      required: ["x"],
    });
  });

  it("defines models extended from models", async () => {
    const res = await oapiForModel(
      "Bar",
      `
      model Foo {
        y: int32;
      };
      model Bar extends Foo {}`
    );

    ok(res.isRef);
    ok(res.schemas.Foo, "expected definition named Foo");
    ok(res.schemas.Bar, "expected definition named Bar");
    deepStrictEqual(res.schemas.Bar, {
      type: "object",
      properties: {},
      allOf: [{ $ref: "#/components/schemas/Foo" }],
    });

    deepStrictEqual(res.schemas.Foo, {
      type: "object",
      properties: { y: { type: "integer", format: "int32" } },
      required: ["y"],
    });
  });

  it("defines models with properties extended from models", async () => {
    const res = await oapiForModel(
      "Bar",
      `
      model Foo {
        y: int32;
      };
      model Bar extends Foo {
        x: int32;
      }`
    );

    ok(res.isRef);
    ok(res.schemas.Foo, "expected definition named Foo");
    ok(res.schemas.Bar, "expected definition named Bar");
    deepStrictEqual(res.schemas.Bar, {
      type: "object",
      properties: { x: { type: "integer", format: "int32" } },
      allOf: [{ $ref: "#/components/schemas/Foo" }],
      required: ["x"],
    });

    deepStrictEqual(res.schemas.Foo, {
      type: "object",
      properties: { y: { type: "integer", format: "int32" } },
      required: ["y"],
    });
  });

  it("defines models extended from templated models", async () => {
    const res = await oapiForModel(
      "Bar",
      `
      model Foo<T> {
        y: T;
      };
      model Bar extends Foo<int32> {}`
    );

    ok(res.isRef);
    ok(res.schemas["Foo_int32"] === undefined, "no definition named Foo_int32");
    ok(res.schemas.Bar, "expected definition named Bar");
    deepStrictEqual(res.schemas.Bar, {
      type: "object",
      properties: { y: { type: "integer", format: "int32" } },
      required: ["y"],
    });
  });

  it("defines models with properties extended from templated models", async () => {
    const res = await oapiForModel(
      "Bar",
      `
      model Foo<T> {
        y: T;
      };
      model Bar extends Foo<int32> {
        x: int32
      }`
    );

    ok(res.isRef);
    ok(res.schemas.Foo_int32, "expected definition named Foo_int32");
    ok(res.schemas.Bar, "expected definition named Bar");
    deepStrictEqual(res.schemas.Bar, {
      type: "object",
      properties: { x: { type: "integer", format: "int32" } },
      allOf: [{ $ref: "#/components/schemas/Foo_int32" }],
      required: ["x"],
    });

    deepStrictEqual(res.schemas.Foo_int32, {
      type: "object",
      properties: { y: { type: "integer", format: "int32" } },
      required: ["y"],
    });
  });

  it("defines templated models with properties extended from templated models", async () => {
    const res = await oapiForModel(
      "Bar<int32>",
      `
      model Foo<T> {
        y: T;
      };
      model Bar<T> extends Foo<T> {
        x: T
      }`
    );

    ok(res.isRef);
    ok(res.schemas.Foo_int32, "expected definition named Foo_int32");
    ok(res.schemas.Bar_int32, "expected definition named Bar_int32");
    deepStrictEqual(res.schemas.Bar_int32, {
      type: "object",
      properties: { x: { type: "integer", format: "int32" } },
      allOf: [{ $ref: "#/components/schemas/Foo_int32" }],
      required: ["x"],
    });

    deepStrictEqual(res.schemas.Foo_int32, {
      type: "object",
      properties: { y: { type: "integer", format: "int32" } },
      required: ["y"],
    });
  });

  it("defines models with no properties extended", async () => {
    const res = await oapiForModel(
      "Bar",
      `
      model Foo {};
      model Bar extends Foo {};`
    );

    ok(res.isRef);
    ok(res.schemas.Foo, "expected definition named Foo");
    ok(res.schemas.Bar, "expected definition named Bar");
    deepStrictEqual(res.schemas.Bar, {
      type: "object",
      properties: {},
      allOf: [{ $ref: "#/components/schemas/Foo" }],
    });

    deepStrictEqual(res.schemas.Foo, {
      type: "object",
      properties: {},
    });
  });

  it("defines models with no properties extended twice", async () => {
    const res = await oapiForModel(
      "Baz",
      `
      model Foo { x: int32 };
      model Bar extends Foo {};
      model Baz extends Bar {};`
    );

    ok(res.isRef);
    ok(res.schemas.Foo, "expected definition named Foo");
    ok(res.schemas.Bar, "expected definition named Bar");
    ok(res.schemas.Baz, "expected definition named Baz");
    deepStrictEqual(res.schemas.Baz, {
      type: "object",
      properties: {},
      allOf: [{ $ref: "#/components/schemas/Bar" }],
    });

    deepStrictEqual(res.schemas.Bar, {
      type: "object",
      properties: {},
      allOf: [{ $ref: "#/components/schemas/Foo" }],
    });

    deepStrictEqual(res.schemas.Foo, {
      type: "object",
      properties: {
        x: {
          format: "int32",
          type: "integer",
        },
      },
      required: ["x"],
    });
  });

  it("defines models extended from primitives", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model shortString extends string {}
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

  it("defines models extended from primitives with attrs", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      @maxLength(10) @minLength(10)
      model shortString extends string {}
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
      model shortString extends string {}
      @minLength(1)
      model shortButNotEmptyString extends shortString {};
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

  it("defines enum types", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      enum PetType {
        Dog, Cat
      }
      model Pet { type: PetType };
      `
    );
    ok(res.isRef);
    strictEqual(res.schemas.Pet.properties.type.$ref, "#/components/schemas/PetType");
    deepStrictEqual(res.schemas.PetType.enum, ["Dog", "Cat"]);
  });

  it("defines nullable properties", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet {
        name: string | null;
      };
      `
    );
    ok(res.isRef);
    deepStrictEqual(res.schemas.Pet, {
      type: "object",
      properties: {
        name: {
          type: "string",
          nullable: true,
          "x-cadl-name": "Cadl.string | Cadl.null",
        },
      },
      required: ["name"],
    });
  });

  it("defines enums with a nullable variant", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet {
        type: "cat" | "dog" | null;
      };
    `
    );
    ok(res.isRef);
    deepStrictEqual(res.schemas.Pet, {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["cat", "dog"],
          nullable: true,
          "x-cadl-name": "cat | dog | Cadl.null",
        },
      },
      required: ["type"],
    });
  });

  it("throws diagnostics for empty enum definitions", async () => {
    let testHost = await createOpenAPITestHost();
    testHost.addCadlFile(
      "main.cadl",
      `
      import "rest";
      import "openapi3";
      using Cadl.Http;
      enum PetType {
      }
      model Pet { type: PetType };
      @route("/")
      namespace root {
        op read(): Pet;
      }
    `
    );

    const diagnostics = await testHost.diagnose("./");
    strictEqual(diagnostics.length, 1);
    match(diagnostics[0].message, /Empty unions are not supported for OpenAPI v3/);
  });

  it("defines request bodies as unions of models", async () => {
    const openApi = await openApiFor(`
      model Cat {
        meow: int32;
      }
      model Dog {
        bark: string;
      }
      @route("/")
      namespace root {
        op create(@body body: Cat | Dog): OkResponse<{}>;
      }
      `);
    ok(openApi.components.schemas.Cat, "expected definition named Cat");
    ok(openApi.components.schemas.Dog, "expected definition named Dog");
    deepStrictEqual(openApi.paths["/"].post.requestBody.content["application/json"].schema, {
      "x-cadl-name": "Cat | Dog",
      anyOf: [{ $ref: "#/components/schemas/Cat" }, { $ref: "#/components/schemas/Dog" }],
    });
  });

  it("defines request bodies as unions of model and non-model types", async () => {
    const openApi = await openApiFor(`
      model Cat {
        meow: int32;
      }
      @route("/")
      namespace root {
        op create(@body body: Cat | string): OkResponse<{}>;
      }
      `);
    ok(openApi.components.schemas.Cat, "expected definition named Cat");
    deepStrictEqual(openApi.paths["/"].post.requestBody.content["application/json"].schema, {
      "x-cadl-name": "Cat | Cadl.string",
      anyOf: [{ $ref: "#/components/schemas/Cat" }, { type: "string" }],
    });
  });

  it("defines request bodies aliased to a union of models", async () => {
    const openApi = await openApiFor(`
    model Cat {
      meow: int32;
    }
    model Dog {
      bark: string;
    }
    alias Pet = Cat | Dog;
    @route("/")
    namespace root {
      op create(@body body: Pet): OkResponse<{}>;
    }
    `);
    ok(openApi.components.schemas.Cat, "expected definition named Cat");
    ok(openApi.components.schemas.Dog, "expected definition named Dog");
    deepStrictEqual(openApi.paths["/"].post.requestBody.content["application/json"].schema, {
      "x-cadl-name": "Cat | Dog",
      anyOf: [{ $ref: "#/components/schemas/Cat" }, { $ref: "#/components/schemas/Dog" }],
    });
  });

  it("defines response bodies as unions of models", async () => {
    const openApi = await openApiFor(`
      model Cat {
        meow: int32;
      }
      model Dog {
        bark: string;
      }
      @route("/")
      namespace root {
        op read(): { @body body: Cat | Dog };
      }
      `);
    ok(openApi.components.schemas.Cat, "expected definition named Cat");
    ok(openApi.components.schemas.Dog, "expected definition named Dog");
    deepStrictEqual(openApi.paths["/"].get.responses["200"].content["application/json"].schema, {
      "x-cadl-name": "Cat | Dog",
      anyOf: [{ $ref: "#/components/schemas/Cat" }, { $ref: "#/components/schemas/Dog" }],
    });
  });

  it("defines response bodies as unions of model and non-model types", async () => {
    const openApi = await openApiFor(`
    model Cat {
      meow: int32;
    }
    @route("/")
    namespace root {
      op read(): { @body body: Cat | string };
    }
    `);
    ok(openApi.components.schemas.Cat, "expected definition named Cat");
    deepStrictEqual(openApi.paths["/"].get.responses["200"].content["application/json"].schema, {
      "x-cadl-name": "Cat | Cadl.string",
      anyOf: [{ $ref: "#/components/schemas/Cat" }, { type: "string" }],
    });
  });

  it("defines response bodies aliased to a union from models", async () => {
    const openApi = await openApiFor(`
      model Cat {
        meow: int32;
      }
      model Dog {
        bark: string;
      }
      alias Pet = Cat | Dog;
      @route("/")
      namespace root {
        op read(): { @body body: Pet };
      }
      `);
    ok(openApi.components.schemas.Cat, "expected definition named Cat");
    ok(openApi.components.schemas.Dog, "expected definition named Dog");
    deepStrictEqual(openApi.paths["/"].get.responses["200"].content["application/json"].schema, {
      "x-cadl-name": "Cat | Dog",
      anyOf: [{ $ref: "#/components/schemas/Cat" }, { $ref: "#/components/schemas/Dog" }],
    });
  });

  it("defines response bodies unioned in OkResponse as unions of models", async () => {
    const openApi = await openApiFor(`
      model Cat {
        meow: int32;
      }
      model Dog {
        bark: string;
      }
      @route("/")
      namespace root {
        op read(): OkResponse<Cat | Dog>;
      }
      `);
    ok(openApi.components.schemas.Cat, "expected definition named Cat");
    ok(openApi.components.schemas.Dog, "expected definition named Dog");
    deepStrictEqual(openApi.paths["/"].get.responses["200"].content["application/json"].schema, {
      "x-cadl-name": "Cat | Dog",
      anyOf: [{ $ref: "#/components/schemas/Cat" }, { $ref: "#/components/schemas/Dog" }],
    });
  });

  it("defines unions with named variants similarly to unnamed unions (it ignores variant names)", async () => {
    const openApi = await openApiFor(`
      model Cat {
        meow: int32;
      }
      model Dog {
        bark: string;
      }
      union Pet { cat: Cat, dog: Dog }
      @route("/")
      namespace root {
        op read(): { @body body: Pet };
      }
      `);
    ok(openApi.components.schemas.Cat, "expected definition named Cat");
    ok(openApi.components.schemas.Dog, "expected definition named Dog");
    ok(openApi.components.schemas.Pet, "expected definition named Pet");
    deepStrictEqual(openApi.components.schemas.Pet, {
      anyOf: [{ $ref: "#/components/schemas/Cat" }, { $ref: "#/components/schemas/Dog" }],
    });
    deepStrictEqual(openApi.paths["/"].get.responses["200"].content["application/json"].schema, {
      $ref: "#/components/schemas/Pet",
    });
  });

  it("defines oneOf schema for unions with @oneOf decorator", async () => {
    const openApi = await openApiFor(`
      model Cat {
        meow: int32;
      }
      model Dog {
        bark: string;
      }
      @oneOf
      union Pet { cat: Cat, dog: Dog }
      @route("/")
      namespace root {
        op read(): { @body body: Pet };
      }
      `);
    ok(openApi.components.schemas.Cat, "expected definition named Cat");
    ok(openApi.components.schemas.Dog, "expected definition named Dog");
    ok(openApi.components.schemas.Pet, "expected definition named Pet");
    deepStrictEqual(openApi.components.schemas.Pet, {
      oneOf: [{ $ref: "#/components/schemas/Cat" }, { $ref: "#/components/schemas/Dog" }],
    });
    deepStrictEqual(openApi.paths["/"].get.responses["200"].content["application/json"].schema, {
      $ref: "#/components/schemas/Pet",
    });
  });
});

describe("openapi3: primitives", () => {
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

  for (const test of cases) {
    it("knows schema for " + test[0], async () => {
      const res = await oapiForModel(
        "Pet",
        `
        model Pet { name: ${test[0]} };
        `
      );

      const schema = res.schemas.Pet.properties.name;
      deepStrictEqual(schema, test[1]);
    });
  }
});

describe("openapi3: literals", () => {
  const cases = [
    ["1", { type: "number", enum: [1] }],
    ['"hello"', { type: "string", enum: ["hello"] }],
    ["false", { type: "boolean", enum: [false] }],
    ["true", { type: "boolean", enum: [true] }],
  ];

  for (const test of cases) {
    it("knows schema for " + test[0], async () => {
      const res = await oapiForModel(
        "Pet",
        `
        model Pet { name: ${test[0]} };
        `
      );

      const schema = res.schemas.Pet.properties.name;
      deepStrictEqual(schema, test[1]);
    });
  }
});

describe("openapi3: operations", () => {
  it("define operations with param with defaults", async () => {
    const res = await openApiFor(
      `
      @route("/")
      namespace root {
        @get()
        op read(@query queryWithDefault?: string = "defaultValue"): string;
      }
      `
    );

    deepStrictEqual(res.paths["/"].get.parameters[0].schema.default, "defaultValue");
  });

  it("define operations with param with decorators", async () => {
    const res = await openApiFor(
      `
      @route("/thing")
      namespace root {
        @get("{name}")
        op getThing(
          @format("^[a-zA-Z0-9-]{3,24}$")
          @path name: string,

          @minValue(1)
          @maxValue(10)
          @query count: int32
        ): string;
      }
      `
    );

    const getThing = res.paths["/thing/{name}"].get;
    ok(getThing);
    ok(getThing.parameters[0].schema);
    ok(getThing.parameters[0].schema.pattern);
    strictEqual(getThing.parameters[0].schema.pattern, "^[a-zA-Z0-9-]{3,24}$");

    ok(getThing.parameters[1].schema);
    ok(getThing.parameters[1].schema.minimum);
    ok(getThing.parameters[1].schema.maximum);
    strictEqual(getThing.parameters[1].schema.minimum, 1);
    strictEqual(getThing.parameters[1].schema.maximum, 10);
  });
});

describe("openapi3: responses", () => {
  it("define responses with response headers", async () => {
    const res = await openApiFor(
      `
      model ETagHeader {
        @header eTag: string;
      }
      model Key {
        key: string;
      }
      @route("/")
      namespace root {
        @get()
        op read(): Key & ETagHeader;
      }
      `
    );
    ok(res.paths["/"].get.responses["200"].headers);
    ok(res.paths["/"].get.responses["200"].headers["e-tag"]);
  });

  it("defines responses with primitive types", async () => {
    const res = await openApiFor(
      `
      @route("/")
      namespace root {
        @get()
        op read(): string;
      }
      `
    );
    ok(res.paths["/"].get.responses["200"]);
    ok(res.paths["/"].get.responses["200"].content);
    strictEqual(
      res.paths["/"].get.responses["200"].content["application/json"].schema.type,
      "string"
    );
  });

  describe("binary responses", () => {
    it("bytes responses should default to application/json with byte format", async () => {
      const res = await openApiFor(
        `
      @route("/")
      namespace root {
        @get op read(): bytes;
      }
      `
      );

      const response = res.paths["/"].get.responses["200"];
      ok(response);
      ok(response.content);
      strictEqual(response.content["application/json"].schema.type, "string");
      strictEqual(response.content["application/json"].schema.format, "byte");
    });

    it("@body body: bytes responses default to application/json with bytes format", async () => {
      const res = await openApiFor(
        `
      @route("/")
      namespace root {
        @get op read(): {@body body: bytes};
      }
      `
      );

      const response = res.paths["/"].get.responses["200"];
      ok(response);
      ok(response.content);
      strictEqual(response.content["application/json"].schema.type, "string");
      strictEqual(response.content["application/json"].schema.format, "byte");
    });

    it("@header contentType text/plain should keep format to byte", async () => {
      const res = await openApiFor(
        `
      @route("/")
      namespace root {
        @get op read(): {@header contentType: "text/plain", @body body: bytes};
      }
      `
      );

      const response = res.paths["/"].get.responses["200"];
      ok(response);
      ok(response.content);
      strictEqual(response.content["text/plain"].schema.type, "string");
      strictEqual(response.content["text/plain"].schema.format, "byte");
    });

    it("@header contentType not json or text should set format to binary", async () => {
      const res = await openApiFor(
        `
      @route("/")
      namespace root {
        @get op read(): {@header contentType: "image/png", @body body: bytes};
      }
      `
      );

      const response = res.paths["/"].get.responses["200"];
      ok(response);
      ok(response.content);
      strictEqual(response.content["image/png"].schema.type, "string");
      strictEqual(response.content["image/png"].schema.format, "binary");
    });
  });
});

describe("openapi3: request", () => {
  describe("binary request", () => {
    it("bytes request should default to application/json byte", async () => {
      const res = await openApiFor(
        `
      @route("/")
      namespace root {
        @post op read(@body body: bytes): {};
      }
      `
      );

      const requestBody = res.paths["/"].post.requestBody;
      ok(requestBody);
      strictEqual(requestBody.content["application/json"].schema.type, "string");
      strictEqual(requestBody.content["application/json"].schema.format, "byte");
    });

    it("bytes request should respect @header contentType and use binary format when not json or text", async () => {
      const res = await openApiFor(
        `
      @route("/")
      namespace root {
        @post op read(@header contentType: "image/png", @body body: bytes): {};
      }
      `
      );

      const requestBody = res.paths["/"].post.requestBody;
      ok(requestBody);
      strictEqual(requestBody.content["image/png"].schema.type, "string");
      strictEqual(requestBody.content["image/png"].schema.format, "binary");
    });
  });
});

describe("openapi3: extension decorator", () => {
  it("adds an arbitrary extension to a model", async () => {
    const oapi = await openApiFor(
      `
      @extension("x-model-extension", "foobar")
      model Pet {
        name: string;
      }
      @route("/")
      namespace root {
        @get()
        op read(): Pet;
      }
      `
    );
    ok(oapi.components.schemas.Pet);
    strictEqual(oapi.components.schemas.Pet["x-model-extension"], "foobar");
  });

  it("adds an arbitrary extension to an operation", async () => {
    const oapi = await openApiFor(
      `
      model Pet {
        name: string;
      }
      @route("/")
      namespace root {
        @get()
        @extension("x-operation-extension", "barbaz")
        op list(): Pet[];
      }
      `
    );
    ok(oapi.paths["/"].get);
    strictEqual(oapi.paths["/"].get["x-operation-extension"], "barbaz");
  });

  it("adds an arbitrary extension to a parameter", async () => {
    const oapi = await openApiFor(
      `
      model Pet {
        name: string;
      }
      model PetId {
        @path
        @extension("x-parameter-extension", "foobaz")
        petId: string;
      }
      @route("/Pets")
      namespace root {
        @get()
        op get(... PetId): Pet;
      }
      `
    );
    ok(oapi.paths["/Pets/{petId}"].get);
    strictEqual(
      oapi.paths["/Pets/{petId}"].get.parameters[0]["$ref"],
      "#/components/parameters/PetId"
    );
    strictEqual(oapi.components.parameters.PetId.name, "petId");
    strictEqual(oapi.components.parameters.PetId["x-parameter-extension"], "foobaz");
  });
});

async function oapiForModel(name: string, modelDef: string) {
  const oapi = await openApiFor(`
    ${modelDef};
    @route("/")
    namespace root {
      op read(): ${name};
    }
  `);

  const useSchema = oapi.paths["/"].get.responses[200].content["application/json"].schema;

  return {
    isRef: !!useSchema.$ref,
    useSchema,
    schemas: oapi.components.schemas || {},
  };
}
