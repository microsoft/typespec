import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { diagnoseOpenApiFor, openApiFor } from "./test-host.js";

describe("openapi3: parameters", () => {
  it("create a query param", async () => {
    const res = await openApiFor(
      `
      op test(@query arg1: string): void;
      `
    );
    strictEqual(res.paths["/"].get.parameters[0].in, "query");
    strictEqual(res.paths["/"].get.parameters[0].name, "arg1");
    deepStrictEqual(res.paths["/"].get.parameters[0].schema, { type: "string" });
  });

  it("create a query param with a different name", async () => {
    const res = await openApiFor(
      `
      op test(@query("$select") select: string): void;
      `
    );
    strictEqual(res.paths["/"].get.parameters[0].in, "query");
    strictEqual(res.paths["/"].get.parameters[0].name, "$select");
  });

  it("create a query param of array type", async () => {
    const res = await openApiFor(
      `
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
      style: "form",
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
      style: "form",
      explode: false,
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

    it("query named contentType doesn't get resolved as the content type parmaeter.", async () => {
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
