import { deepStrictEqual } from "assert";
import { openApiFor } from "./test-host.js";

describe("openapi3: metadata", () => {
  it("can make properties optional", async () => {
    const res = await openApiFor(`
      model Widget { 
        name: string; 
        specs: WidgetSpecs;
      }
      model WidgetSpecs {
        color: string;
        weight: float64;
      }
      @post op create(...Widget): void;
      @patch op update(...Widget): void;
  `);

    const requestSchema = res.paths["/"].patch.requestBody.content["application/json"].schema;
    deepStrictEqual(requestSchema, { $ref: "#/components/schemas/WidgetUpdate" });

    deepStrictEqual(res.components.schemas.Widget.required, ["name", "specs"]);
    deepStrictEqual(res.components.schemas.WidgetUpdate.required, undefined);
    deepStrictEqual(res.components.schemas.WidgetSpecs.required, ["color", "weight"]);
    deepStrictEqual(res.components.schemas.WidgetSpecsUpdate.required, undefined);
  });

  it("can share readonly properties", async () => {
    const res = await openApiFor(`
      model M {
        @visibility("read") r?: string;
        d?: string;
      }
      @route("/") @post op create(...M): M; 
    `);

    const request = res.paths["/"].post.requestBody.content["application/json"].schema;
    deepStrictEqual(request, { $ref: "#/components/schemas/M" });

    const response = res.paths["/"].post.responses["200"].content["application/json"].schema;
    deepStrictEqual(response, { $ref: "#/components/schemas/M" });

    deepStrictEqual(res.components.schemas, {
      M: {
        type: "object",
        properties: {
          r: { type: "string", readOnly: true },
          d: { type: "string" },
        },
      },
    });
  });

  it("does not emit invisible, unshared readonly properties", async () => {
    const res = await openApiFor(`
    model M {
      @visibility("read") r?: string;
      @visibility("create") c?: string;
      @visibility("update") u?: string;
    }
    @route("/") @post op create(...M): M; 
  `);

    const request = res.paths["/"].post.requestBody.content["application/json"].schema;
    deepStrictEqual(request, { $ref: "#/components/schemas/MCreate" });

    const response = res.paths["/"].post.responses["200"].content["application/json"].schema;
    deepStrictEqual(response, { $ref: "#/components/schemas/M" });

    deepStrictEqual(res.components.schemas, {
      MCreate: {
        type: "object",
        properties: {
          c: { type: "string" },
        },
      },
      M: {
        type: "object",
        properties: {
          r: { type: "string", readOnly: true },
        },
      },
    });
  });

  it("bubbles up visibility changes to referencers", async () => {
    const res = await openApiFor(
      `
    model M {
      @visibility("read") r?: string;
      @visibility("create") c?: string;
      @visibility("update") u?: string;
      @visibility("delete") d?: string;
      @visibility("query") q?: string;
    }

    // base model
    model D extends M {}
    
    // property type
    model R {
      m?: M; 
    }

    // union variant
    model U {
      e?: M | string;
    }

    // array element type
    model A {
      a?: M[];
    }

    @route("/M")
    interface IM {
      @get get(...M): M;
      @post create(...M): M;
      @put createOrUpdate(...M): M;
      @patch update(...M): M;
      @delete delete(...M): void; 
    }

    @route("/D")
    interface ID {
      @get get(...D): D;
      @post create(...D): D;
      @put createOrUpdate(...D): D;
      @patch update(...D): D;
      @delete delete(...D): void; 
    }
  
    @route("/R") 
    interface IR {
      @get op get(id: string): R;
      @post op create(...R): R;
      @put op createOrUpdate(...R): R;
      @patch op update(...R): R;
      @delete op delete(...D): void; 
    }

    @route("/U") interface IU {
      @get op get(id: string): U;
      @post op create(...U): U;
      @put op createOrUpdate(...U): U;
      @patch op update(...U): U;
      @delete op delete(...U): void;
    }
    `,
      undefined,
      { "omit-unreachable-types": true }
    );

    deepStrictEqual(res.components.schemas, {
      M: {
        type: "object",
        properties: {
          r: {
            type: "string",
            readOnly: true,
          },
        },
      },
      MCreate: {
        type: "object",
        properties: {
          c: {
            type: "string",
          },
        },
      },
      MCreateOrUpdate: {
        type: "object",
        properties: {
          c: {
            type: "string",
          },
          u: {
            type: "string",
          },
        },
      },
      MDelete: {
        type: "object",
        properties: {
          d: {
            type: "string",
          },
        },
      },
      MQuery: {
        type: "object",
        properties: {
          q: {
            type: "string",
          },
        },
      },
      MUpdate: {
        type: "object",
        properties: {
          u: {
            type: "string",
          },
        },
      },
      D: {
        type: "object",
        properties: {},
        allOf: [
          {
            $ref: "#/components/schemas/M",
          },
        ],
      },
      DCreate: {
        type: "object",
        properties: {},
        allOf: [
          {
            $ref: "#/components/schemas/MCreate",
          },
        ],
      },
      DCreateOrUpdate: {
        type: "object",
        properties: {},
        allOf: [
          {
            $ref: "#/components/schemas/MCreateOrUpdate",
          },
        ],
      },
      DDelete: {
        type: "object",
        properties: {},
        allOf: [
          {
            $ref: "#/components/schemas/MDelete",
          },
        ],
      },
      DQuery: {
        type: "object",
        properties: {},
        allOf: [
          {
            $ref: "#/components/schemas/MQuery",
          },
        ],
      },
      DUpdate: {
        type: "object",
        properties: {},
        allOf: [
          {
            $ref: "#/components/schemas/MUpdate",
          },
        ],
      },
      R: {
        type: "object",
        properties: {
          m: {
            $ref: "#/components/schemas/M",
          },
        },
      },
      RCreate: {
        type: "object",
        properties: {
          m: {
            $ref: "#/components/schemas/MCreate",
          },
        },
      },
      RCreateOrUpdate: {
        type: "object",
        properties: {
          m: {
            $ref: "#/components/schemas/MCreateOrUpdate",
          },
        },
      },
      RUpdate: {
        type: "object",
        properties: {
          m: {
            $ref: "#/components/schemas/MUpdate",
          },
        },
      },
      U: {
        type: "object",
        properties: {
          e: {
            anyOf: [
              {
                $ref: "#/components/schemas/M",
              },
              {
                type: "string",
              },
            ],
            "x-typespec-name": "M | string",
          },
        },
      },
      UCreate: {
        type: "object",
        properties: {
          e: {
            anyOf: [
              {
                $ref: "#/components/schemas/MCreate",
              },
              {
                type: "string",
              },
            ],
            "x-typespec-name": "M | string",
          },
        },
      },
      UCreateOrUpdate: {
        type: "object",
        properties: {
          e: {
            anyOf: [
              {
                $ref: "#/components/schemas/MCreateOrUpdate",
              },
              {
                type: "string",
              },
            ],
            "x-typespec-name": "M | string",
          },
        },
      },
      UDelete: {
        type: "object",
        properties: {
          e: {
            anyOf: [
              {
                $ref: "#/components/schemas/MDelete",
              },
              {
                type: "string",
              },
            ],
            "x-typespec-name": "M | string",
          },
        },
      },
      UUpdate: {
        type: "object",
        properties: {
          e: {
            anyOf: [
              {
                $ref: "#/components/schemas/MUpdate",
              },
              {
                type: "string",
              },
            ],
            "x-typespec-name": "M | string",
          },
        },
      },
    });
  });

  it("puts inapplicable metadata in schema", async () => {
    const res = await openApiFor(
      `
      model Parameters {
       @query q: string;
       @path p: string;
       @header h: string;
      }
      @route("/single") @get op single(...Parameters): string;
      @route("/batch") @get op batch(...Body<Parameters[]>): string;
      `
    );
    deepStrictEqual(res.paths, {
      "/single/{p}": {
        get: {
          operationId: "single",
          parameters: [
            { $ref: "#/components/parameters/Parameters.q" },
            { $ref: "#/components/parameters/Parameters.p" },
            { $ref: "#/components/parameters/Parameters.h" },
          ],
          responses: {
            "200": {
              description: "The request has succeeded.",
              content: { "application/json": { schema: { type: "string" } } },
            },
          },
        },
      },
      "/batch": {
        get: {
          operationId: "batch",
          parameters: [],
          responses: {
            "200": {
              description: "The request has succeeded.",
              content: { "application/json": { schema: { type: "string" } } },
            },
          },
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Parameters" },
                  "x-typespec-name": "Parameters[]",
                },
              },
            },
          },
        },
      },
    });
    deepStrictEqual(res.components, {
      parameters: {
        "Parameters.q": {
          name: "q",
          in: "query",
          required: true,
          schema: { type: "string" },
        },
        "Parameters.p": {
          name: "p",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        "Parameters.h": {
          name: "h",
          in: "header",
          required: true,
          schema: { type: "string" },
        },
      },
      schemas: {
        Parameters: {
          properties: {
            h: {
              type: "string",
            },
            p: {
              type: "string",
            },
            q: {
              type: "string",
            },
          },
          required: ["q", "p", "h"],
          type: "object",
        },
      },
    });
  });

  it("Constructs an implicit body from non-metadata parameters", async () => {
    const res = await openApiFor(
      `
      @route("/test") @post op test(
        @query q: string;
        @header h: string;
        foo: string;
        bar: int32;
      ): string;
      `
    );
    deepStrictEqual(res.paths, {
      "/test": {
        post: {
          operationId: "test",
          parameters: [
            {
              name: "q",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "h",
              in: "header",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "The request has succeeded.",
              content: { "application/json": { schema: { type: "string" } } },
            },
          },
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  properties: {
                    bar: {
                      format: "int32",
                      type: "integer",
                    },
                    foo: {
                      type: "string",
                    },
                  },
                  required: ["foo", "bar"],
                  type: "object",
                  "x-typespec-name": "(anonymous model)",
                },
              },
            },
          },
        },
      },
    });
  });

  it("Supports optional request bodies", async () => {
    const res = await openApiFor(
      `
      model Parameters {
        @query q: string;
        @path p: string;
        @header h: string;
      }
      @route("/batch") @post op batch(@body body?: Parameters[]): string;
      `
    );
    deepStrictEqual(res.paths, {
      "/batch": {
        post: {
          operationId: "batch",
          parameters: [],
          responses: {
            "200": {
              description: "The request has succeeded.",
              content: { "application/json": { schema: { type: "string" } } },
            },
          },
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Parameters" },
                  "x-typespec-name": "Parameters[]",
                },
              },
            },
          },
        },
      },
    });
    deepStrictEqual(res.components, {
      schemas: {
        Parameters: {
          properties: {
            h: {
              type: "string",
            },
            p: {
              type: "string",
            },
            q: {
              type: "string",
            },
          },
          required: ["q", "p", "h"],
          type: "object",
        },
      },
    });
  });

  it("uses item suffix if array element has inapplicable metadata and is used with more than one visibility.", async () => {
    const res = await openApiFor(
      `
      model Thing {
        @header etag: string;
        name: string;
        @visibility("delete") d: string;
      }
      @route("/") @post op createMultiple(...Thing): Thing[];
      `
    );

    const request = res.paths["/"].post.requestBody.content["application/json"].schema;
    deepStrictEqual(request, { $ref: "#/components/schemas/Thing" });

    const response = res.paths["/"].post.responses["200"].content["application/json"].schema;
    deepStrictEqual(response, {
      type: "array",
      items: { $ref: "#/components/schemas/ThingItem" },
      "x-typespec-name": "Thing[]",
    });

    deepStrictEqual(res.components, {
      parameters: {
        "Thing.etag": {
          name: "etag",
          in: "header",
          required: true,
          schema: { type: "string" },
        },
      },
      schemas: {
        Thing: {
          type: "object",
          properties: {
            name: { type: "string" },
          },
          required: ["name"],
        },
        ThingItem: {
          type: "object",
          properties: {
            etag: { type: "string" },
            name: { type: "string" },
          },
          required: ["etag", "name"],
        },
      },
    });
  });

  it("handles cycle in untransformed model", async () => {
    const res = await openApiFor(
      `
      model Thing {
       inner?: Thing;
      }
      @route("/") @get op get(): Thing;
      `
    );

    const response = res.paths["/"].get.responses["200"].content["application/json"].schema;
    deepStrictEqual(response, { $ref: "#/components/schemas/Thing" });

    deepStrictEqual(res.components.schemas, {
      Thing: {
        type: "object",
        properties: {
          inner: {
            $ref: "#/components/schemas/Thing",
          },
        },
      },
    });
  });

  it("handles cycle in transformed model", async () => {
    const res = await openApiFor(
      `
      model Thing {
        @visibility("update") u?: string;
        @visibility("create") c?: string;
        inner?: Thing;
      }

      @route("/") @post op create(...Thing): Thing;
      `
    );

    const request = res.paths["/"].post.requestBody.content["application/json"].schema;
    deepStrictEqual(request, { $ref: "#/components/schemas/ThingCreate" });

    const response = res.paths["/"].post.responses["200"].content["application/json"].schema;
    deepStrictEqual(response, { $ref: "#/components/schemas/Thing" });

    deepStrictEqual(res.components.schemas, {
      Thing: {
        type: "object",
        properties: {
          inner: { $ref: "#/components/schemas/Thing" },
        },
      },
      ThingCreate: {
        type: "object",
        properties: {
          c: { type: "string" },
          inner: { $ref: "#/components/schemas/ThingCreate" },
        },
      },
    });
  });

  it("supports nested metadata and removes emptied properties", async () => {
    const res = await openApiFor(
      `
      model Pet {
        headers: {
          @header h1: string;
          moreHeaders: {
            @header h2: string;
          }
        };

        @path
        id: string;
        name: string;
      }
      
      @route("/pets")
      @post op create(...Pet): Pet;
      `
    );

    deepStrictEqual(res.paths, {
      "/pets/{id}": {
        post: {
          operationId: "create",
          parameters: [
            {
              $ref: "#/components/parameters/Pet.id",
            },
            {
              name: "h1",
              in: "header",
              required: true,
              schema: {
                type: "string",
              },
            },
            {
              name: "h2",
              in: "header",
              required: true,
              schema: {
                type: "string",
              },
            },
          ],
          responses: {
            "200": {
              description: "The request has succeeded.",
              headers: {
                h1: {
                  required: true,
                  schema: {
                    type: "string",
                  },
                },
                h2: {
                  required: true,
                  schema: {
                    type: "string",
                  },
                },
              },
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Pet",
                  },
                },
              },
            },
          },
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PetCreate",
                },
              },
            },
          },
        },
      },
    });

    deepStrictEqual(res.components.schemas, {
      PetCreate: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
        },
        required: ["name"],
      },
      Pet: {
        type: "object",
        properties: {
          id: {
            type: "string",
          },
          name: {
            type: "string",
          },
        },
        required: ["id", "name"],
      },
    });
  });
});
