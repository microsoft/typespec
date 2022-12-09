import { resolvePath } from "@cadl-lang/compiler";
import { expectDiagnosticEmpty } from "@cadl-lang/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { OpenAPI3EmitterOptions } from "../src/lib.js";
import { OpenAPI3Document } from "../src/types.js";
import { createOpenAPITestRunner, oapiForModel, openApiFor } from "./test-host.js";

describe("openapi3: output file", () => {
  async function rawOpenApiFor(code: string, options: OpenAPI3EmitterOptions): Promise<string> {
    const runner = await createOpenAPITestRunner();

    const outPath = resolvePath("/openapi.json");

    const diagnostics = await runner.diagnose(code, {
      noEmit: false,
      emit: ["@cadl-lang/openapi3"],
      options: { "@cadl-lang/openapi3": { ...options, "output-file": outPath } },
    });

    expectDiagnosticEmpty(diagnostics.filter((x) => x.code !== "@cadl-lang/rest/no-routes"));

    return runner.fs.get(outPath)!;
  }

  // Content of an empty spec
  const expectedEmptySpec = [
    "{",
    `  "openapi": "3.0.0",`,
    `  "info": {`,
    `    "title": "(title)",`,
    `    "version": "0000-00-00"`,
    `  },`,
    `  "tags": [],`,
    `  "paths": {},`,
    `  "components": {}`,
    "}",
    "",
  ];

  it("emit LF line endings by default", async () => {
    const output = await rawOpenApiFor("", {});
    strictEqual(output, expectedEmptySpec.join("\n"));
  });

  it("emit CRLF when configured", async () => {
    const output = await rawOpenApiFor("", { "new-line": "crlf" });
    strictEqual(output, expectedEmptySpec.join("\r\n"));
  });
});

describe("openapi3: types included", () => {
  async function openapiWithOptions(
    code: string,
    options: OpenAPI3EmitterOptions
  ): Promise<OpenAPI3Document> {
    const runner = await createOpenAPITestRunner();

    const outPath = resolvePath("/openapi.json");

    const diagnostics = await runner.diagnose(code, {
      noEmit: false,
      emit: ["@cadl-lang/openapi3"],
      options: { "@cadl-lang/openapi3": { ...options, "output-file": outPath } },
    });

    expectDiagnosticEmpty(diagnostics.filter((x) => x.code !== "@cadl-lang/rest/no-routes"));

    const content = runner.fs.get(outPath)!;
    return JSON.parse(content);
  }

  it("emit unreferenced types by default", async () => {
    const output = await openapiWithOptions(
      `
      model NotReferenced {name: string}
      model Referenced {name: string}

      op test(): Referenced;
    `,
      {}
    );
    deepStrictEqual(Object.keys(output.components!.schemas!), ["Referenced", "NotReferenced"]);
  });

  it("emit only referenced types when using omit-unreachable-types", async () => {
    const output = await openapiWithOptions(
      `
      model NotReferenced {name: string}
      model Referenced {name: string}

      op test(): Referenced;
    `,
      {
        "omit-unreachable-types": true,
      }
    );
    deepStrictEqual(Object.keys(output.components!.schemas!), ["Referenced"]);
  });
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
      @get()
      op read(@query queryWithDefault?: string = "defaultValue"): string;
      `
    );

    deepStrictEqual(res.paths["/"].get.parameters[0].schema.default, "defaultValue");
  });

  it("define operations with param with decorators", async () => {
    const res = await openApiFor(
      `
      @get
      @route("/thing/{name}")
      op getThing(
        @pattern("^[a-zA-Z0-9-]{3,24}$")
        @path name: string,

        @minValue(1)
        @maxValue(10)
        @query count: int32
      ): string;
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

  it("deprecate operations with @deprecated", async () => {
    const res = await openApiFor(
      `
      @deprecated("use something else")
      op read(@query query: string): string;
      `
    );

    strictEqual(res.paths["/"].get.deprecated, true);
  });
});

describe("openapi3: request", () => {
  describe("binary request", () => {
    it("bytes request should default to application/json byte", async () => {
      const res = await openApiFor(`
        @post op read(@body body: bytes): {};
      `);

      const requestBody = res.paths["/"].post.requestBody;
      ok(requestBody);
      strictEqual(requestBody.content["application/json"].schema.type, "string");
      strictEqual(requestBody.content["application/json"].schema.format, "byte");
    });

    it("bytes request should respect @header contentType and use binary format when not json or text", async () => {
      const res = await openApiFor(`
        @post op read(@header contentType: "image/png", @body body: bytes): {};
      `);

      const requestBody = res.paths["/"].post.requestBody;
      ok(requestBody);
      strictEqual(requestBody.content["image/png"].schema.type, "string");
      strictEqual(requestBody.content["image/png"].schema.format, "binary");
    });
  });
});

describe("openapi3: extension decorator", () => {
  it("adds an arbitrary extension to a model", async () => {
    const oapi = await openApiFor(`
      @extension("x-model-extension", "foobar")
      model Pet {
        name: string;
      }
      @get() op read(): Pet;
      `);
    ok(oapi.components.schemas.Pet);
    strictEqual(oapi.components.schemas.Pet["x-model-extension"], "foobar");
  });

  it("adds an arbitrary extension to an operation", async () => {
    const oapi = await openApiFor(
      `
      model Pet {
        name: string;
      }
      @get()
      @extension("x-operation-extension", "barbaz")
      op list(): Pet[];
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
      @get()
      op get(... PetId): Pet;
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

  it("check format and pattern decorator on model", async () => {
    const oapi = await openApiFor(
      `
      model Pet extends PetId {
        @pattern("^[a-zA-Z0-9-]{3,24}$")
        name: string;
      }
      model PetId {
        @path
        @pattern("^[a-zA-Z0-9-]{3,24}$")
        @format("UUID")
        petId: string;
      }
      @route("/Pets")
      @get()
      op get(... PetId): Pet;
      `
    );
    ok(oapi.paths["/Pets/{petId}"].get);
    strictEqual(
      oapi.paths["/Pets/{petId}"].get.parameters[0]["$ref"],
      "#/components/parameters/PetId"
    );
    strictEqual(oapi.components.parameters.PetId.name, "petId");
    strictEqual(oapi.components.schemas.Pet.properties.name.pattern, "^[a-zA-Z0-9-]{3,24}$");
    strictEqual(oapi.components.parameters.PetId.schema.format, "UUID");
    strictEqual(oapi.components.parameters.PetId.schema.pattern, "^[a-zA-Z0-9-]{3,24}$");
  });
});
