import { describe, expect, it } from "vitest";
import { OpenAPI3Response } from "../../src/types.js";
import { renderTypeSpecForOpenAPI3, validateTsp } from "./utils/tsp-for-openapi3.js";

const response: OpenAPI3Response = {
  description: "test response",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
};

it("generates operations with no params", async () => {
  const tsp = await renderTypeSpecForOpenAPI3({
    paths: {
      "/": {
        get: {
          operationId: "rootGet",
          parameters: [],
          responses: {
            "200": response,
          },
        },
      },
    },
  });

  expect(tsp).toMatchInlineSnapshot(`
    "import "@typespec/http";
    import "@typespec/openapi";
    import "@typespec/openapi3";

    using Http;
    using OpenAPI;

    @service(#{ title: "Test Service" })
    @info(#{ version: "1.0.0" })
    namespace TestService;

    @route("/") @get op rootGet(): Body<{
      message?: string;
    }>;
    "
  `);

  await validateTsp(tsp);
});

it("generates operations without common params", async () => {
  const tsp = await renderTypeSpecForOpenAPI3({
    paths: {
      "/{id}": {
        get: {
          operationId: "idGet",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": response,
          },
        },
      },
    },
  });

  expect(tsp).toMatchInlineSnapshot(`
    "import "@typespec/http";
    import "@typespec/openapi";
    import "@typespec/openapi3";

    using Http;
    using OpenAPI;

    @service(#{ title: "Test Service" })
    @info(#{ version: "1.0.0" })
    namespace TestService;

    @route("/{id}") @get op idGet(@path id: string): Body<{
      message?: string;
    }>;
    "
  `);

  await validateTsp(tsp);
});

it("generates operations with common params", async () => {
  const tsp = await renderTypeSpecForOpenAPI3({
    paths: {
      "/{id}": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        get: {
          operationId: "idGet",
          parameters: [],
          responses: {
            "200": response,
          },
        },
      },
    },
  });

  expect(tsp).toMatchInlineSnapshot(`
    "import "@typespec/http";
    import "@typespec/openapi";
    import "@typespec/openapi3";

    using Http;
    using OpenAPI;

    @service(#{ title: "Test Service" })
    @info(#{ version: "1.0.0" })
    namespace TestService;

    @route("/{id}") @get op idGet(@path id: string): Body<{
      message?: string;
    }>;
    "
  `);

  await validateTsp(tsp);
});

it("generates operations with common and specific params", async () => {
  const tsp = await renderTypeSpecForOpenAPI3({
    paths: {
      "/{id}": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        get: {
          operationId: "idGet",
          parameters: [{ name: "foo", in: "query", schema: { type: "string" } }],
          responses: {
            "200": response,
          },
        },
      },
    },
  });

  expect(tsp).toMatchInlineSnapshot(`
    "import "@typespec/http";
    import "@typespec/openapi";
    import "@typespec/openapi3";

    using Http;
    using OpenAPI;

    @service(#{ title: "Test Service" })
    @info(#{ version: "1.0.0" })
    namespace TestService;

    @route("/{id}") @get op idGet(@path id: string, @query(#{ explode: true }) foo?: string): Body<{
      message?: string;
    }>;
    "
  `);

  await validateTsp(tsp);
});

it("supports overriding common params with operation params", async () => {
  const tsp = await renderTypeSpecForOpenAPI3({
    paths: {
      "/{id}": {
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "x-header", in: "header", required: false, schema: { type: "string" } },
        ],
        get: {
          operationId: "idGet",
          parameters: [
            { name: "foo", in: "query", schema: { type: "string" } },
            { name: "x-header", in: "header", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": response,
          },
        },
        put: {
          operationId: "idPut",
          parameters: [],
          responses: {
            "200": response,
          },
        },
      },
    },
  });

  // op idGet should have a required x-header
  // op idPut should have an optional x-header

  expect(tsp).toMatchInlineSnapshot(`
    "import "@typespec/http";
    import "@typespec/openapi";
    import "@typespec/openapi3";

    using Http;
    using OpenAPI;

    @service(#{ title: "Test Service" })
    @info(#{ version: "1.0.0" })
    namespace TestService;

    @route("/{id}") @get op idGet(
      @path id: string,
      @query(#{ explode: true }) foo?: string,
      @header \`x-header\`: string,
    ): Body<{
      message?: string;
    }>;

    @route("/{id}") @put op idPut(@path id: string, @header \`x-header\`?: string): Body<{
      message?: string;
    }>;
    "
  `);

  await validateTsp(tsp);
});

it("supports operation summary", async () => {
  const tsp = await renderTypeSpecForOpenAPI3({
    paths: {
      "/": {
        get: {
          operationId: "rootGet",
          summary: "Root Get Summary",
          parameters: [],
          responses: {
            "200": response,
          },
        },
      },
    },
  });

  expect(tsp).toMatchInlineSnapshot(`
    "import "@typespec/http";
    import "@typespec/openapi";
    import "@typespec/openapi3";

    using Http;
    using OpenAPI;

    @service(#{ title: "Test Service" })
    @info(#{ version: "1.0.0" })
    namespace TestService;

    @route("/")
    @get
    @summary("Root Get Summary")
    op rootGet(): Body<{
      message?: string;
    }>;
    "
  `);

  await validateTsp(tsp);
});

describe("responses", () => {
  describe("mapped status codes", () => {
    it.each([
      { statusCode: 200, response: "OkResponse" },
      { statusCode: 201, response: "CreatedResponse" },
      { statusCode: 202, response: "AcceptedResponse" },
      { statusCode: 204, response: "NoContentResponse" },
      { statusCode: 304, response: "NotModifiedResponse" },
      { statusCode: 400, response: "BadRequestResponse" },
      { statusCode: 401, response: "UnauthorizedResponse" },
      { statusCode: 403, response: "ForbiddenResponse" },
      { statusCode: 404, response: "NotFoundResponse" },
      { statusCode: 409, response: "ConflictResponse" },
    ])(`converts plain $statusCode to $response`, async ({ statusCode, response }) => {
      const tsp = await renderTypeSpecForOpenAPI3({
        schemas: {
          Foo: {
            type: "object",
            properties: {
              id: { type: "string" },
              message: { type: "string" },
            },
            required: ["id"],
          },
        },
        paths: {
          "/": {
            get: {
              operationId: "getFoo",
              parameters: [],
              responses: {
                [`${statusCode}`]: {
                  description: "test response",
                },
              },
            },
          },
        },
      });

      expect(tsp).toBe(`import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service(#{ title: "Test Service" })
@info(#{ version: "1.0.0" })
namespace TestService;

model Foo {
  id: string;
  message?: string;
}

@route("/") @get op getFoo(): ${response};
`);
    });

    const mappedStatusCode = "201";

    it("intersects named status code with referenced body", async () => {
      const tsp = await renderTypeSpecForOpenAPI3({
        schemas: {
          Foo: {
            type: "object",
            properties: {
              id: { type: "string" },
              message: { type: "string" },
            },
            required: ["id"],
          },
        },
        paths: {
          "/": {
            get: {
              operationId: "getFoo",
              parameters: [],
              responses: {
                [mappedStatusCode]: {
                  description: "test response",
                  content: {
                    "application/json": {
                      schema: {
                        $ref: "#/components/schemas/Foo",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      expect(tsp).toMatchInlineSnapshot(`
        "import "@typespec/http";
        import "@typespec/openapi";
        import "@typespec/openapi3";

        using Http;
        using OpenAPI;

        @service(#{ title: "Test Service" })
        @info(#{ version: "1.0.0" })
        namespace TestService;

        model Foo {
          id: string;
          message?: string;
        }

        @route("/") @get op getFoo(): CreatedResponse & Foo;
        "
      `);

      await validateTsp(tsp);
    });

    it("intersects named status code with headers", async () => {
      const tsp = await renderTypeSpecForOpenAPI3({
        paths: {
          "/": {
            get: {
              operationId: "getFoo",
              parameters: [],
              responses: {
                [mappedStatusCode]: {
                  description: "test response",
                  headers: { foo: { schema: { type: "string" } } },
                },
              },
            },
          },
        },
      });

      expect(tsp).toMatchInlineSnapshot(`
        "import "@typespec/http";
        import "@typespec/openapi";
        import "@typespec/openapi3";

        using Http;
        using OpenAPI;

        @service(#{ title: "Test Service" })
        @info(#{ version: "1.0.0" })
        namespace TestService;

        @route("/") @get op getFoo(): CreatedResponse & {
          @header foo?: string;
        };
        "
      `);

      await validateTsp(tsp);
    });

    it("uses literal status code when headers and body present", async () => {
      const tsp = await renderTypeSpecForOpenAPI3({
        paths: {
          "/": {
            get: {
              operationId: "getFoo",
              parameters: [],
              responses: {
                [mappedStatusCode]: {
                  description: "test response",
                  headers: { foo: { schema: { type: "string" } } },
                  content: { "application/json": { schema: { type: "string" } } },
                },
              },
            },
          },
        },
      });

      expect(tsp).toMatchInlineSnapshot(`
        "import "@typespec/http";
        import "@typespec/openapi";
        import "@typespec/openapi3";

        using Http;
        using OpenAPI;

        @service(#{ title: "Test Service" })
        @info(#{ version: "1.0.0" })
        namespace TestService;

        @route("/") @get op getFoo(): {
          @statusCode statusCode: 201;
          @header foo?: string;
          @body body: string;
        };
        "
      `);

      await validateTsp(tsp);
    });
  });

  // 200 status codes are the default used in TypeSpec as long as long as operation returnType isn't `void`
  describe("statusCode: 200", () => {
    const statusCode = "200";
    it("returns referenced body by itself when no headers defined", async () => {
      const tsp = await renderTypeSpecForOpenAPI3({
        schemas: {
          Foo: {
            type: "object",
            properties: {
              id: { type: "string" },
              message: { type: "string" },
            },
            required: ["id"],
          },
        },
        paths: {
          "/": {
            get: {
              operationId: "getFoo",
              parameters: [],
              responses: {
                [statusCode]: {
                  description: "test response",
                  content: {
                    "application/json": {
                      schema: {
                        $ref: "#/components/schemas/Foo",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      expect(tsp).toMatchInlineSnapshot(`
        "import "@typespec/http";
        import "@typespec/openapi";
        import "@typespec/openapi3";

        using Http;
        using OpenAPI;

        @service(#{ title: "Test Service" })
        @info(#{ version: "1.0.0" })
        namespace TestService;

        model Foo {
          id: string;
          message?: string;
        }

        @route("/") @get op getFoo(): Foo;
        "
      `);

      await validateTsp(tsp);
    });

    it("returns wrapped in-line body by itself when no headers defined", async () => {
      const tsp = await renderTypeSpecForOpenAPI3({
        paths: {
          "/": {
            get: {
              operationId: "getFoo",
              parameters: [],
              responses: {
                [statusCode]: {
                  description: "test response",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          message: { type: "string" },
                        },
                        required: ["id"],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      expect(tsp).toMatchInlineSnapshot(`
        "import "@typespec/http";
        import "@typespec/openapi";
        import "@typespec/openapi3";

        using Http;
        using OpenAPI;

        @service(#{ title: "Test Service" })
        @info(#{ version: "1.0.0" })
        namespace TestService;

        @route("/") @get op getFoo(): Body<{
          id: string;
          message?: string;
        }>;
        "
      `);

      await validateTsp(tsp);
    });

    it("returns single model expression when headers defined", async () => {
      const tsp = await renderTypeSpecForOpenAPI3({
        paths: {
          "/": {
            get: {
              operationId: "getFoo",
              parameters: [],
              responses: {
                [statusCode]: {
                  description: "test response",
                  headers: { foo: { schema: { type: "string" } } },
                },
              },
            },
          },
        },
      });

      expect(tsp).toMatchInlineSnapshot(`
        "import "@typespec/http";
        import "@typespec/openapi";
        import "@typespec/openapi3";

        using Http;
        using OpenAPI;

        @service(#{ title: "Test Service" })
        @info(#{ version: "1.0.0" })
        namespace TestService;

        @route("/") @get op getFoo(): {
          @header foo?: string;
        };
        "
      `);

      await validateTsp(tsp);
    });

    it("returns single model expression when headers and body defined", async () => {
      const tsp = await renderTypeSpecForOpenAPI3({
        paths: {
          "/": {
            get: {
              operationId: "getFoo",
              parameters: [],
              responses: {
                [statusCode]: {
                  description: "test response",
                  headers: { foo: { schema: { type: "string" } } },
                  content: { "application/json": { schema: { type: "string" } } },
                },
              },
            },
          },
        },
      });

      expect(tsp).toMatchInlineSnapshot(`
        "import "@typespec/http";
        import "@typespec/openapi";
        import "@typespec/openapi3";

        using Http;
        using OpenAPI;

        @service(#{ title: "Test Service" })
        @info(#{ version: "1.0.0" })
        namespace TestService;

        @route("/") @get op getFoo(): {
          @header foo?: string;
          @body body: string;
        };
        "
      `);

      await validateTsp(tsp);
    });
  });

  describe("statusCode: default", () => {
    const statusCode = "default";
    it("returns DefaultResponse when nothing is defined", async () => {
      const tsp = await renderTypeSpecForOpenAPI3({
        paths: {
          "/": {
            get: {
              operationId: "getFoo",
              parameters: [],
              responses: {
                [statusCode]: {} as OpenAPI3Response,
              },
            },
          },
        },
      });

      expect(tsp).toMatchInlineSnapshot(`
        "import "@typespec/http";
        import "@typespec/openapi";
        import "@typespec/openapi3";

        using Http;
        using OpenAPI;

        @service(#{ title: "Test Service" })
        @info(#{ version: "1.0.0" })
        namespace TestService;

        @route("/") @get op getFoo(): GeneratedHelpers.DefaultResponse;

        namespace GeneratedHelpers {
          @doc(Description)
          @error
          model DefaultResponse<
            Description extends valueof string = "",
            Body = void,
            Headers extends {} = {}
          > {
            @body body: Body;
            ...Headers;
          }
        }
        "
      `);

      await validateTsp(tsp);
    });

    it("returns DefaultResponse with description", async () => {
      const tsp = await renderTypeSpecForOpenAPI3({
        paths: {
          "/": {
            get: {
              operationId: "getFoo",
              parameters: [],
              responses: {
                [statusCode]: {
                  description: "Test Response",
                },
              },
            },
          },
        },
      });

      expect(tsp).toMatchInlineSnapshot(`
        "import "@typespec/http";
        import "@typespec/openapi";
        import "@typespec/openapi3";

        using Http;
        using OpenAPI;

        @service(#{ title: "Test Service" })
        @info(#{ version: "1.0.0" })
        namespace TestService;

        @route("/") @get op getFoo(): GeneratedHelpers.DefaultResponse<Description = "Test Response">;

        namespace GeneratedHelpers {
          @doc(Description)
          @error
          model DefaultResponse<
            Description extends valueof string = "",
            Body = void,
            Headers extends {} = {}
          > {
            @body body: Body;
            ...Headers;
          }
        }
        "
      `);

      await validateTsp(tsp);
    });

    it("returns DefaultResponse with headers", async () => {
      const tsp = await renderTypeSpecForOpenAPI3({
        paths: {
          "/": {
            get: {
              operationId: "getFoo",
              parameters: [],
              responses: {
                [statusCode]: {
                  description: "Test Response",
                  headers: { foo: { schema: { type: "string" } } },
                } as OpenAPI3Response,
              },
            },
          },
        },
      });

      expect(tsp).toMatchInlineSnapshot(`
        "import "@typespec/http";
        import "@typespec/openapi";
        import "@typespec/openapi3";

        using Http;
        using OpenAPI;

        @service(#{ title: "Test Service" })
        @info(#{ version: "1.0.0" })
        namespace TestService;

        @route("/") @get op getFoo(): GeneratedHelpers.DefaultResponse<
          Description = "Test Response",
          Headers = {
            @header foo?: string;
          }
        >;

        namespace GeneratedHelpers {
          @doc(Description)
          @error
          model DefaultResponse<
            Description extends valueof string = "",
            Body = void,
            Headers extends {} = {}
          > {
            @body body: Body;
            ...Headers;
          }
        }
        "
      `);

      await validateTsp(tsp);
    });

    it("returns DefaultResponse with body", async () => {
      const tsp = await renderTypeSpecForOpenAPI3({
        paths: {
          "/": {
            get: {
              operationId: "getFoo",
              parameters: [],
              responses: {
                [statusCode]: {
                  description: "Test Response",
                  content: { "application/json": { schema: { type: "string" } } },
                } as OpenAPI3Response,
              },
            },
          },
        },
      });

      expect(tsp).toMatchInlineSnapshot(`
        "import "@typespec/http";
        import "@typespec/openapi";
        import "@typespec/openapi3";

        using Http;
        using OpenAPI;

        @service(#{ title: "Test Service" })
        @info(#{ version: "1.0.0" })
        namespace TestService;

        @route("/") @get op getFoo(): GeneratedHelpers.DefaultResponse<
          Description = "Test Response",
          Body = string
        >;

        namespace GeneratedHelpers {
          @doc(Description)
          @error
          model DefaultResponse<
            Description extends valueof string = "",
            Body = void,
            Headers extends {} = {}
          > {
            @body body: Body;
            ...Headers;
          }
        }
        "
      `);

      await validateTsp(tsp);
    });

    it("returns DefaultResponse with description, headers, and body", async () => {
      const tsp = await renderTypeSpecForOpenAPI3({
        paths: {
          "/": {
            get: {
              operationId: "getFoo",
              parameters: [],
              responses: {
                [statusCode]: {
                  description: "Test Response",
                  headers: { foo: { schema: { type: "string" } } },
                  content: { "application/json": { schema: { type: "string" } } },
                },
              },
            },
          },
        },
      });

      expect(tsp).toMatchInlineSnapshot(`
        "import "@typespec/http";
        import "@typespec/openapi";
        import "@typespec/openapi3";

        using Http;
        using OpenAPI;

        @service(#{ title: "Test Service" })
        @info(#{ version: "1.0.0" })
        namespace TestService;

        @route("/") @get op getFoo(): GeneratedHelpers.DefaultResponse<
          Description = "Test Response",
          Headers = {
            @header foo?: string;
          },
          Body = string
        >;

        namespace GeneratedHelpers {
          @doc(Description)
          @error
          model DefaultResponse<
            Description extends valueof string = "",
            Body = void,
            Headers extends {} = {}
          > {
            @body body: Body;
            ...Headers;
          }
        }
        "
      `);

      await validateTsp(tsp);
    });
  });

  describe("unmapped status codes", () => {
    const statusCode = "100";
    it("returns a single model expression", async () => {
      const tsp = await renderTypeSpecForOpenAPI3({
        schemas: {
          Foo: { type: "string" },
        },
        paths: {
          "/": {
            get: {
              operationId: "getFoo",
              parameters: [],
              responses: {
                [statusCode]: {
                  description: "Test Response",
                  headers: { foo: { schema: { type: "string" } } },
                  content: { "application/json": { schema: { type: "string" } } },
                },
              },
            },
            head: {
              operationId: "headFoo",
              parameters: [],
              responses: {
                [statusCode]: {
                  description: "Test Response",
                  content: { "application/json": { schema: { $ref: "#/components/schemas/Foo" } } },
                } as OpenAPI3Response,
              },
            },
          },
        },
      });

      expect(tsp).toMatchInlineSnapshot(`
        "import "@typespec/http";
        import "@typespec/openapi";
        import "@typespec/openapi3";

        using Http;
        using OpenAPI;

        @service(#{ title: "Test Service" })
        @info(#{ version: "1.0.0" })
        namespace TestService;

        scalar Foo extends string;

        @route("/") @get op getFoo(): {
          @statusCode statusCode: 100;
          @header foo?: string;
          @body body: string;
        };

        @route("/") @head op headFoo(): {
          @statusCode statusCode: 100;
          @body body: Foo;
        };
        "
      `);

      await validateTsp(tsp);
    });
  });

  it("supports multiple content types and status codes", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      paths: {
        "/": {
          get: {
            operationId: "getFoo",
            parameters: [],
            responses: {
              "200": {
                description: "test response",
                content: {
                  "application/json": { schema: { type: "string" } },
                  "application/xml": { schema: { type: "string" } },
                },
              },
              default: {
                description: "test response",
                content: {
                  "application/json": { schema: { type: "string" } },
                  "application/xml": { schema: { type: "string" } },
                },
              },
            },
          },
        },
      },
    });

    expect(tsp).toMatchInlineSnapshot(`
      "import "@typespec/http";
      import "@typespec/openapi";
      import "@typespec/openapi3";

      using Http;
      using OpenAPI;

      @service(#{ title: "Test Service" })
      @info(#{ version: "1.0.0" })
      namespace TestService;

      @route("/") @get op getFoo():
        | Body<string>
        | {
            @header contentType: "application/xml";
            @body body: string;
          }
        | GeneratedHelpers.DefaultResponse<Description = "test response", Body = string>
        | GeneratedHelpers.DefaultResponse<
            Description = "test response",
            Headers = {
              @header contentType: "application/xml";
            },
            Body = string
          >;

      namespace GeneratedHelpers {
        @doc(Description)
        @error
        model DefaultResponse<
          Description extends valueof string = "",
          Body = void,
          Headers extends {} = {}
        > {
          @body body: Body;
          ...Headers;
        }
      }
      "
    `);

    await validateTsp(tsp);
  });

  it("supports references", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      schemas: {
        Foo: {
          type: "object",
          properties: {
            id: { type: "string" },
            message: { type: "string" },
          },
          required: ["id"],
        },
      },
      responses: {
        TestResponse: {
          description: "test response",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Foo" },
            },
          },
        },
      },
      paths: {
        "/": {
          get: {
            operationId: "getFoo",
            parameters: [],
            responses: {
              "200": {
                $ref: "#/components/responses/TestResponse",
              },
            },
          },
        },
      },
    });

    expect(tsp).toMatchInlineSnapshot(`
      "import "@typespec/http";
      import "@typespec/openapi";
      import "@typespec/openapi3";

      using Http;
      using OpenAPI;

      @service(#{ title: "Test Service" })
      @info(#{ version: "1.0.0" })
      namespace TestService;

      model Foo {
        id: string;
        message?: string;
      }

      @route("/") @get op getFoo(): Foo;
      "
    `);

    await validateTsp(tsp);
  });

  it("supports references with descriptions", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      schemas: {
        Foo: {
          type: "object",
          properties: {
            id: { type: "string" },
            message: { type: "string" },
          },
          required: ["id"],
        },
      },
      responses: {
        TestResponse: {
          description: "Base description",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Foo" },
            },
          },
        },
      },
      paths: {
        "/": {
          get: {
            operationId: "getFoo",
            parameters: [],
            responses: {
              default: {
                $ref: "#/components/responses/TestResponse",
                description: "Overwritten description",
              },
            },
          },
          head: {
            operationId: "headFoo",
            parameters: [],
            responses: {
              default: {
                $ref: "#/components/responses/TestResponse",
              },
            },
          },
        },
      },
    });

    expect(tsp).toMatchInlineSnapshot(`
      "import "@typespec/http";
      import "@typespec/openapi";
      import "@typespec/openapi3";

      using Http;
      using OpenAPI;

      @service(#{ title: "Test Service" })
      @info(#{ version: "1.0.0" })
      namespace TestService;

      model Foo {
        id: string;
        message?: string;
      }

      @route("/") @get op getFoo(): GeneratedHelpers.DefaultResponse<
        Description = "Overwritten description",
        Body = Foo
      >;

      @route("/") @head op headFoo(): GeneratedHelpers.DefaultResponse<
        Description = "Base description",
        Body = Foo
      >;

      namespace GeneratedHelpers {
        @doc(Description)
        @error
        model DefaultResponse<
          Description extends valueof string = "",
          Body = void,
          Headers extends {} = {}
        > {
          @body body: Body;
          ...Headers;
        }
      }
      "
    `);

    await validateTsp(tsp);
  });

  it("supports header references", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      schemas: {
        Foo: {
          type: "object",
          properties: {
            id: { type: "string" },
            message: { type: "string" },
          },
          required: ["id"],
        },
      },
      headers: {
        TestHeader: {
          schema: { type: "string" },
          description: "my test header",
        },
      },
      responses: {
        TestResponse: {
          description: "test response",
          headers: {
            "x-test": { $ref: "#/components/headers/TestHeader" },
            "x-test2": { schema: { type: "string" } },
          },
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Foo" },
            },
          },
        },
      },
      paths: {
        "/": {
          get: {
            operationId: "getFoo",
            parameters: [],
            responses: {
              "200": {
                $ref: "#/components/responses/TestResponse",
              },
            },
          },
        },
      },
    });

    expect(tsp).toMatchInlineSnapshot(`
      "import "@typespec/http";
      import "@typespec/openapi";
      import "@typespec/openapi3";

      using Http;
      using OpenAPI;

      @service(#{ title: "Test Service" })
      @info(#{ version: "1.0.0" })
      namespace TestService;

      model Foo {
        id: string;
        message?: string;
      }

      @route("/") @get op getFoo(): {
        /** my test header */
        @header("x-test") xTest?: string;

        @header("x-test2") xTest2?: string;
        @body body: Foo;
      };
      "
    `);

    await validateTsp(tsp);
  });
});

describe("requestBody", () => {
  it("generates operations with body", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      schemas: {
        Foo: {
          type: "object",
          properties: {
            id: { type: "string" },
            message: { type: "string" },
          },
          required: ["id"],
        },
      },
      paths: {
        "/": {
          post: {
            operationId: "postFoo",
            parameters: [],
            responses: {
              "200": {
                description: "test response",
              },
            },
            requestBody: {
              description: "This is a test",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Foo" },
                },
              },
            },
          },
        },
      },
    });

    expect(tsp).toMatchInlineSnapshot(`
      "import "@typespec/http";
      import "@typespec/openapi";
      import "@typespec/openapi3";

      using Http;
      using OpenAPI;

      @service(#{ title: "Test Service" })
      @info(#{ version: "1.0.0" })
      namespace TestService;

      model Foo {
        id: string;
        message?: string;
      }

      @route("/") @post op postFoo(
        /** This is a test */
        @body body: Foo,
      ): OkResponse;
      "
    `);

    await validateTsp(tsp);
  });

  it("supports $ref", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      schemas: {
        Foo: {
          type: "object",
          properties: {
            id: { type: "string" },
            message: { type: "string" },
          },
          required: ["id"],
        },
      },
      requestBodies: {
        FooBody: {
          description: "This is a test",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Foo" },
            },
          },
        },
      },
      paths: {
        "/": {
          post: {
            operationId: "postFoo",
            parameters: [],
            responses: {
              "200": {
                description: "test response",
              },
            },
            requestBody: {
              $ref: "#/components/requestBodies/FooBody",
            },
          },
        },
      },
    });

    expect(tsp).toMatchInlineSnapshot(`
      "import "@typespec/http";
      import "@typespec/openapi";
      import "@typespec/openapi3";

      using Http;
      using OpenAPI;

      @service(#{ title: "Test Service" })
      @info(#{ version: "1.0.0" })
      namespace TestService;

      model Foo {
        id: string;
        message?: string;
      }

      @route("/") @post op postFoo(
        /** This is a test */
        @body body: Foo,
      ): OkResponse;
      "
    `);

    await validateTsp(tsp);
  });

  it("supports overriding description in $ref", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      schemas: {
        Foo: {
          type: "object",
          properties: {
            id: { type: "string" },
            message: { type: "string" },
          },
          required: ["id"],
        },
      },
      requestBodies: {
        FooBody: {
          description: "This is a test",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Foo" },
            },
          },
        },
      },
      paths: {
        "/": {
          post: {
            operationId: "postFoo",
            parameters: [],
            responses: {
              "200": {
                description: "test response",
              },
            },
            requestBody: {
              description: "Overwritten description",
              $ref: "#/components/requestBodies/FooBody",
            },
          },
        },
      },
    });

    expect(tsp).toMatchInlineSnapshot(`
      "import "@typespec/http";
      import "@typespec/openapi";
      import "@typespec/openapi3";

      using Http;
      using OpenAPI;

      @service(#{ title: "Test Service" })
      @info(#{ version: "1.0.0" })
      namespace TestService;

      model Foo {
        id: string;
        message?: string;
      }

      @route("/") @post op postFoo(
        /** Overwritten description */
        @body body: Foo,
      ): OkResponse;
      "
    `);

    await validateTsp(tsp);
  });

  it("generates separate operations for multipart and non-multipart content types", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      schemas: {
        RealtimeCallCreateRequest: {
          type: "object",
          required: ["sdp", "session"],
          properties: {
            sdp: {
              type: "string",
              description: "sdp",
            },
            session: {
              type: "object",
              properties: {
                user_id: {
                  type: "string",
                  description: "User ID",
                },
              },
            },
          },
        },
      },
      paths: {
        "/realtime/calls": {
          post: {
            operationId: "create-realtime-call",
            summary: "Create call",
            parameters: [],
            requestBody: {
              required: true,
              content: {
                "multipart/form-data": {
                  schema: {
                    $ref: "#/components/schemas/RealtimeCallCreateRequest",
                  },
                  encoding: {
                    sdp: {
                      contentType: "application/sdp",
                    },
                    session: {
                      contentType: "application/json",
                    },
                  },
                },
                "application/sdp": {
                  schema: {
                    type: "string",
                    description: "SDP",
                  },
                },
              },
            },
            responses: {
              "204": {
                description: "No Content",
              },
            },
          },
        },
      },
    });

    // Should generate separate operations for multipart and non-multipart
    expect(tsp).toContain("@sharedRoute");
    expect(tsp).toContain("@multipartBody");
    expect(tsp).toContain('contentType: "multipart/form-data"');
    expect(tsp).toContain('"application/sdp"');
    expect(tsp).toContain("create-realtime-callMultipart");
    expect(tsp).toContain("create-realtime-callSdp");

    await validateTsp(tsp);
  });
});
