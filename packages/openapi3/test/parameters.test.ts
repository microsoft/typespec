import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, expect, it } from "vitest";
import { OpenAPI3PathParameter, OpenAPI3QueryParameter } from "../src/types.js";
import { diagnoseOpenApiFor, openApiFor } from "./test-host.js";

describe("query parameters", () => {
  async function getQueryParam(code: string): Promise<OpenAPI3QueryParameter> {
    const res = await openApiFor(code);
    const param = res.paths[`/`].get.parameters[0];
    strictEqual(param.in, "query");
    return param;
  }

  it("create a query param", async () => {
    const param = await getQueryParam(
      `op test(@query myParam: string): void;
      `
    );
    strictEqual(param.name, "myParam");
    deepStrictEqual(param.schema, { type: "string" });
  });

  it("create a query param with a different name", async () => {
    const param = await getQueryParam(
      `
      op test(@query("$select") select: string): void;
      `
    );
    strictEqual(param.in, "query");
    strictEqual(param.name, "$select");
  });

  describe("set explode: true", () => {
    it("with option", async () => {
      const param = await getQueryParam(`op test(@query(#{explode: true}) myParam: string): void;`);
      expect(param).toMatchObject({
        explode: true,
      });
    });

    it("with uri template", async () => {
      const param = await getQueryParam(`@route("{?myParam*}") op test(myParam: string): void;`);
      expect(param).toMatchObject({
        explode: true,
      });
    });
  });

  it("LEGACY: specify the format", async () => {
    const res = await openApiFor(
      `
      #suppress "deprecated" "test"
      op test(
        @query({name: "$multi", format: "multi"}) multis: string[],
        @query({name: "$csv", format: "csv"}) csvs: string[],
        #suppress "@typespec/openapi3/invalid-format" "test"
        @query({name: "$tsv", format: "tsv"}) tsvs: string[],
        @query({name: "$ssv", format: "ssv"}) ssvs: string[],
        @query({name: "$pipes", format: "pipes"}) pipes: string[]
      ): void;
      `
    );
    const params = res.paths["/"].get.parameters;
    deepStrictEqual(params[0], {
      in: "query",
      name: "$multi",
      required: true,
      explode: true,
      schema: {
        type: "array",
        items: {
          type: "string",
        },
      },
    });
    deepStrictEqual(params[1], {
      in: "query",
      name: "$csv",
      schema: {
        type: "array",
        items: {
          type: "string",
        },
      },
      required: true,
    });
    deepStrictEqual(params[2], {
      in: "query",
      name: "$tsv",
      schema: {
        type: "string",
      },
      required: true,
    });
    deepStrictEqual(params[3], {
      in: "query",
      name: "$ssv",
      style: "spaceDelimited",
      required: true,
      schema: {
        type: "array",
        items: {
          type: "string",
        },
      },
      explode: false,
    });
    deepStrictEqual(params[4], {
      in: "query",
      name: "$pipes",
      style: "pipeDelimited",
      required: true,
      schema: {
        type: "array",
        items: {
          type: "string",
        },
      },
      explode: false,
    });
  });

  it("create a query param that is a model property", async () => {
    const res = await openApiFor(
      `
      op test(@query id: UserContext.id): void;
      
      model UserContext {
        id: string;
      }
      `
    );
    deepStrictEqual(res.paths["/"].get.parameters[0], {
      in: "query",
      name: "id",
      required: true,
      schema: {
        type: "string",
      },
    });
  });

  it("create an header param", async () => {
    const res = await openApiFor(
      `
      op test(@header arg1: string): void;
      `
    );
    strictEqual(res.paths["/"].get.parameters[0].in, "header");
    strictEqual(res.paths["/"].get.parameters[0].name, "arg1");
    deepStrictEqual(res.paths["/"].get.parameters[0].schema, { type: "string" });
  });

  it("create an header param with a different name", async () => {
    const res = await openApiFor(
      `
      op test(@header("foo-bar") foo: string): void;
      `
    );
    strictEqual(res.paths["/"].get.parameters[0].in, "header");
    strictEqual(res.paths["/"].get.parameters[0].name, "foo-bar");
  });

  it("create a header param of array type", async () => {
    const res = await openApiFor(
      `
      op test(
        @header({name: "$csv", format: "csv"}) csvs: string[],
        #suppress "@typespec/openapi3/invalid-format" "test"
        @header({name: "$multi", format: "multi"}) multis: string[],
        #suppress "@typespec/openapi3/invalid-format" "test"
        @header({name: "$tsv", format: "tsv"}) tsvs: string[],
        #suppress "@typespec/openapi3/invalid-format" "test"
        @header({name: "$ssv", format: "ssv"}) ssvs: string[],
        #suppress "@typespec/openapi3/invalid-format" "test"
        @header({name: "$pipes", format: "pipes"}) pipes: string[]
      ): void;
      `
    );
    const params = res.paths["/"].get.parameters;
    deepStrictEqual(params[0], {
      in: "header",
      name: "$csv",
      style: "simple",
      schema: {
        type: "array",
        items: {
          type: "string",
        },
      },
      required: true,
    });
    deepStrictEqual(params[1], {
      in: "header",
      name: "$multi",
      required: true,
      schema: {
        type: "string",
      },
    });
    deepStrictEqual(params[2], {
      in: "header",
      name: "$tsv",
      schema: {
        type: "string",
      },
      required: true,
    });
    deepStrictEqual(params[3], {
      in: "header",
      name: "$ssv",
      required: true,
      schema: {
        type: "string",
      },
    });
    deepStrictEqual(params[4], {
      in: "header",
      name: "$pipes",
      required: true,
      schema: {
        type: "string",
      },
    });
  });

  // Regression test for https://github.com/microsoft/typespec/issues/414
  it("@doc set the description on the parameter not its schema", async () => {
    const res = await openApiFor(
      `
      op test(@query @doc("my-doc") arg1: string): void;
      `
    );
    strictEqual(res.paths["/"].get.parameters[0].description, "my-doc");
    strictEqual(res.paths["/"].get.parameters[0].schema.description, undefined);
  });

  it("errors on duplicate parameter keys", async () => {
    const diagnostics = await diagnoseOpenApiFor(
      `
      model P {
        @query id: string;
      }

      @friendlyName("P")
      model Q {
        @header id: string;
      }

      @route("/test1")
      op test1(...P): void;

      @route("/test2")
      op test2(...Q): void;
      `,
      { "omit-unreachable-types": true }
    );

    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/openapi/duplicate-type-name",
        message: /parameter/,
      },
    ]);
  });

  it("encodes parameter keys in references", async () => {
    const oapi = await openApiFor(`
      model Pet extends Pet$Id {
        name: string;
      }
      model Pet$Id {
        @path
        petId: string;
      }

      @route("/Pets")
      @get()
      op get(... Pet$Id): Pet;
      `);

    ok(oapi.paths["/Pets/{petId}"].get);
    strictEqual(
      oapi.paths["/Pets/{petId}"].get.parameters[0]["$ref"],
      "#/components/parameters/Pet%24Id"
    );
    strictEqual(oapi.components.parameters["Pet$Id"].name, "petId");
  });

  it("inline spread of parameters from anonymous model", async () => {
    const oapi = await openApiFor(
      `
      op template<TParameters, TReturn>(...TParameters): TReturn;
      op instantiation is template<{@path id: string}, void>;
      `
    );

    ok(oapi.paths["/{id}"].get);

    deepStrictEqual(oapi.paths["/{id}"].get.parameters, [
      {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "string",
        },
      },
    ]);
  });

  it("omit parameters with type never", async () => {
    const res = await openApiFor(
      `
      op test(@query select: never, @query top: int32): void;
      `
    );
    strictEqual(res.paths["/"].get.parameters.length, 1);
    strictEqual(res.paths["/"].get.parameters[0].in, "query");
    strictEqual(res.paths["/"].get.parameters[0].name, "top");
  });

  it("omit request body if type is void", async () => {
    const res = await openApiFor(`op test(@body foo: void ): void;`);
    strictEqual(res.paths["/"].post.requestBody, undefined);
  });

  it("using @body ignore any metadata property underneath", async () => {
    const res = await openApiFor(`@get op read(
      @body body: {
        #suppress "@typespec/http/metadata-ignored"
        @header header: string,
        #suppress "@typespec/http/metadata-ignored"
        @query query: string,
        #suppress "@typespec/http/metadata-ignored"
        @statusCode code: 201,
      }
    ): void;`);
    expect(res.paths["/"].get.requestBody.content["application/json"].schema).toEqual({
      type: "object",
      properties: {
        header: { type: "string" },
        query: { type: "string" },
        code: { type: "number", enum: [201] },
      },
      required: ["header", "query", "code"],
    });
  });

  describe("request parameters resolving to no property in the body produce no body", () => {
    it.each(["()", "(@header prop: string)", `(@visibility("none") prop: string)`])(
      "%s",
      async (params) => {
        const res = await openApiFor(`op test${params}: void;`);
        strictEqual(res.paths["/"].get.requestBody, undefined);
      }
    );
  });

  it("property in body with only metadata properties should still be included", async () => {
    const res = await openApiFor(`op read(
        headers: {
          @header header1: string;
          @header header2: string;
        };
        name: string;
      ): void;`);
    expect(res.paths["/"].post.requestBody.content["application/json"].schema).toEqual({
      type: "object",
      properties: {
        headers: { type: "object" },
        name: { type: "string" },
      },
      required: ["headers", "name"],
    });
  });

  it("property in body with only metadata properties and @bodyIgnore should not be included", async () => {
    const res = await openApiFor(`op read(
        @bodyIgnore headers: {
          @header header1: string;
          @header header2: string;
        };
        name: string;
    ): void;`);
    expect(res.paths["/"].post.requestBody.content["application/json"].schema).toEqual({
      type: "object",
      properties: {
        name: { type: "string" },
      },
      required: ["name"],
    });
  });

  describe("content type parameter", () => {
    it("header named with 'Content-Type' gets resolved as content type for operation.", async () => {
      const res = await openApiFor(
        `
        op test(
          @header("Content-Type") explicitContentType: "application/octet-stream",
          @body foo: string
        ): void;
        `
      );
      ok(res.paths["/"].post.requestBody.content["application/octet-stream"]);
      deepStrictEqual(res.paths["/"].post.requestBody.content["application/octet-stream"].schema, {
        type: "string",
      });
    });

    it("header named contentType gets resolved as content type for operation.", async () => {
      const res = await openApiFor(
        `
        op test(
          @header contentType: "application/octet-stream",
          @body foo: string
        ): void;
        `
      );
      ok(res.paths["/"].post.requestBody.content["application/octet-stream"]);
      deepStrictEqual(res.paths["/"].post.requestBody.content["application/octet-stream"].schema, {
        type: "string",
      });
    });

    it("query named contentType doesn't get resolved as the content type parameter.", async () => {
      const res = await openApiFor(
        `
        op test(
          @query contentType: "application/octet-stream",
          @body foo: string
        ): void;
        `
      );
      strictEqual(res.paths["/"].post.requestBody.content["application/octet-stream"], undefined);
      ok(res.paths["/"].post.requestBody.content["application/json"]);
    });
  });
});

describe("path parameters", () => {
  async function getPathParam(code: string, name = "myParam"): Promise<OpenAPI3PathParameter> {
    const res = await openApiFor(code);
    return res.paths[`/{${name}}`].get.parameters[0];
  }

  it("figure out the route parameter from the name of the param", async () => {
    const res = await openApiFor(`op test(@path myParam: string): void;`);
    expect(res.paths).toHaveProperty("/{myParam}");
  });

  it("uses explicit name provided from @path", async () => {
    const res = await openApiFor(`op test(@path("my-custom-path") myParam: string): void;`);
    expect(res.paths).toHaveProperty("/{my-custom-path}");
  });

  describe("set explode: true", () => {
    it("with option", async () => {
      const param = await getPathParam(`op test(@path(#{explode: true}) myParam: string[]): void;`);
      expect(param).toMatchObject({
        explode: true,
        schema: {
          type: "array",
          items: { type: "string" },
        },
      });
    });
    it("with uri template", async () => {
      const param = await getPathParam(`@route("{myParam*}") op test(myParam: string[]): void;`);
      expect(param).toMatchObject({
        explode: true,
        schema: {
          type: "array",
          items: { type: "string" },
        },
      });
    });
  });

  describe("set style: simple", () => {
    it("with option", async () => {
      const param = await getPathParam(`op test(@path(#{style: "simple"}) myParam: string): void;`);
      expect(param).not.toHaveProperty("style");
    });

    it("with uri template", async () => {
      const param = await getPathParam(`@route("{myParam}") op test(myParam: string): void;`);
      expect(param).not.toHaveProperty("style");
    });
  });

  describe("set style: label", () => {
    it("with option", async () => {
      const param = await getPathParam(`op test(@path(#{style: "label"}) myParam: string): void;`);
      expect(param).toMatchObject({
        style: "label",
      });
    });

    it("with uri template", async () => {
      const param = await getPathParam(`@route("{.myParam}") op test(myParam: string): void;`);
      expect(param).toMatchObject({
        style: "label",
      });
    });
  });

  describe("set style: matrix", () => {
    it("with option", async () => {
      const param = await getPathParam(`op test(@path(#{style: "matrix"}) myParam: string): void;`);
      expect(param).toMatchObject({
        style: "matrix",
      });
    });

    it("with uri template", async () => {
      const param = await getPathParam(`@route("{;myParam}") op test(myParam: string): void;`);
      expect(param).toMatchObject({
        style: "matrix",
      });
    });
  });

  describe("emit diagnostic when using style: path", () => {
    it("with option", async () => {
      const diagnostics = await diagnoseOpenApiFor(
        `op test(@path(#{style: "path"}) myParam: string): void;`
      );
      expectDiagnostics(diagnostics, { code: "@typespec/openapi3/invalid-style" });
    });

    it("with uri template", async () => {
      const diagnostics = await diagnoseOpenApiFor(
        `@route("{/myParam}") op test(myParam: string): void;`
      );
      expectDiagnostics(diagnostics, { code: "@typespec/openapi3/invalid-style" });
    });
  });

  describe("emit diagnostic when using style: fragment", () => {
    it("with option", async () => {
      const diagnostics = await diagnoseOpenApiFor(
        `op test(@path(#{style: "fragment"}) myParam: string): void;`
      );
      expectDiagnostics(diagnostics, { code: "@typespec/openapi3/invalid-style" });
    });

    it("with uri template", async () => {
      const diagnostics = await diagnoseOpenApiFor(
        `@route("{#myParam}") op test(myParam: string): void;`
      );
      expectDiagnostics(diagnostics, { code: "@typespec/openapi3/invalid-style" });
    });
  });

  describe("emit diagnostic when using reserved expansion", () => {
    it("with option", async () => {
      const diagnostics = await diagnoseOpenApiFor(
        `op test(@path(#{allowReserved: true}) myParam: string): void;`
      );
      expectDiagnostics(diagnostics, { code: "@typespec/openapi3/path-reserved-expansion" });
    });

    it("with uri template", async () => {
      const diagnostics = await diagnoseOpenApiFor(
        `@route("{+myParam}") op test(myParam: string): void;`
      );
      expectDiagnostics(diagnostics, { code: "@typespec/openapi3/path-reserved-expansion" });
    });
  });
});
