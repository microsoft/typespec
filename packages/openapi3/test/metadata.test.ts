import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { openApiFor } from "./test-host.js";

describe("openapi3: metadata", () => {
  it("will expose all properties on unreferenced models but filter properties on referenced models", async () => {
    const res = await openApiFor(`
      model M {
        @visibility("read") r: string;
        @visibility("create", "update") uc?: string;
        @visibility("read", "create") rc?: string;
        @visibility("read", "update", "create") ruc?: string;
      }
    `);

    deepStrictEqual(res.components.schemas, {
      M: {
        type: "object",
        properties: {
          r: { type: "string", readOnly: true },
          uc: { type: "string" },
          rc: { type: "string" },
          ruc: { type: "string" },
        },
        required: ["r"],
      },
    });
  });

  it("prioritizes read visibility when referenced and unreferenced models share schemas", async () => {
    const res = await openApiFor(`
      model Shared {
        @visibility("create", "update") password: string;
        prop: string;
      }

      model Unreferenced {
        @visibility("read") r: string;
        @visibility("create") c: string;
        shared: Shared;
      }

      model Referenced {
        @visibility("read") r: string;
        @visibility("create") c: string;
        shared: Shared;
      }

      @get op get(): Referenced;
    `);

    deepStrictEqual(res.components.schemas, {
      Referenced: {
        type: "object",
        properties: {
          r: { type: "string", readOnly: true },
          shared: { $ref: "#/components/schemas/Shared" },
        },
        required: ["r", "shared"],
      },
      Shared: {
        type: "object",
        required: ["prop"],
        properties: {
          prop: {
            type: "string",
          },
        },
      },
      SharedReadOrCreateOrUpdateOrDeleteOrQuery: {
        type: "object",
        required: ["password", "prop"],
        properties: {
          password: {
            type: "string",
          },
          prop: {
            type: "string",
          },
        },
      },
      Unreferenced: {
        type: "object",
        properties: {
          c: { type: "string" },
          r: { type: "string", readOnly: true },
          shared: { $ref: "#/components/schemas/SharedReadOrCreateOrUpdateOrDeleteOrQuery" },
        },
        required: ["r", "c", "shared"],
      },
    });
  });

  it("will expose create visibility properties on PATCH model using @requestVisibility", async () => {
    const res = await openApiFor(`
      model M {
        @visibility("read") r: string;
        @visibility("read", "create") rc?: string;
        @visibility("read", "update", "create") ruc?: string;
      }
      @parameterVisibility("create", "update")
      @route("/") @patch op createOrUpdate(...M): M; 
    `);

    const response = res.paths["/"].patch.responses["200"].content["application/json"].schema;
    const request = res.paths["/"].patch.requestBody.content["application/json"].schema;

    deepStrictEqual(response, { $ref: "#/components/schemas/M" });
    deepStrictEqual(request, { $ref: "#/components/schemas/MCreateOrUpdate" });
    deepStrictEqual(res.components.schemas, {
      M: {
        type: "object",
        properties: {
          r: { type: "string", readOnly: true },
          rc: { type: "string" },
          ruc: { type: "string" },
        },
        required: ["r"],
      },
      MCreateOrUpdate: {
        type: "object",
        properties: {
          rc: { type: "string" },
          ruc: { type: "string" },
        },
      },
    });
  });

  it("will expose create visibility properties on PUT model", async () => {
    const res = await openApiFor(`
      model M {
        @visibility("read") r: string;
        @visibility("read", "create") rc?: string;
        @visibility("read", "update", "create") ruc?: string;
      }
      @route("/") @put op createOrUpdate(...M): M; 
    `);

    const response = res.paths["/"].put.responses["200"].content["application/json"].schema;
    const request = res.paths["/"].put.requestBody.content["application/json"].schema;

    deepStrictEqual(response, { $ref: "#/components/schemas/M" });
    deepStrictEqual(request, { $ref: "#/components/schemas/M" });
    deepStrictEqual(res.components.schemas, {
      M: {
        type: "object",
        properties: {
          r: { type: "string", readOnly: true },
          rc: { type: "string" },
          ruc: { type: "string" },
        },
        required: ["r"],
      },
    });
  });

  it("ensures properties are required for array updates", async () => {
    const res = await openApiFor(`
      model Person {
        @visibility("read") id: string;
        @visibility("create") secret: string;
        name: string;
      
        @visibility("read", "create")
        test: string;
      
        @visibility("other", "read", "update")
        other: string;
      
        @visibility("read", "create", "update")
        relatives: PersonRelative[];
      }
      
      model PersonRelative {
        person: Person;
        relationship: string;
      }
      @route("/") @patch op update(...Person): Person; 
    `);

    const response = res.paths["/"].patch.responses["200"].content["application/json"].schema;
    const request = res.paths["/"].patch.requestBody.content["application/json"].schema;

    deepStrictEqual(response, { $ref: "#/components/schemas/Person" });
    deepStrictEqual(request, { $ref: "#/components/schemas/PersonUpdate" });
    deepStrictEqual(res.components.schemas.PersonUpdateItem, {
      type: "object",
      properties: {
        name: { type: "string" },
        other: { type: "string" },
        relatives: {
          type: "array",
          items: { $ref: "#/components/schemas/PersonRelativeUpdateItem" },
        },
      },
      required: ["name", "other", "relatives"],
    });
    deepStrictEqual(res.components.schemas.PersonRelativeUpdateItem, {
      type: "object",
      properties: {
        person: { $ref: "#/components/schemas/PersonUpdateItem" },
        relationship: { type: "string" },
      },
      required: ["person", "relationship"],
    });
  });

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

  it("emits the appropriate properties for ResourceCreateModel", async () => {
    const res = await openApiFor(`
    using TypeSpec.Rest.Resource;

    model M {
      @visibility("read") r?: string;
      @visibility("create") c?: string;
      @visibility("update") u?: string;
      all: string;
    }

    model MCreate is ResourceCreateModel<M>;

    @route("/") @post op create(...MCreate): M; 
    `);

    deepStrictEqual(res.components.schemas, {
      MCreate: {
        type: "object",
        description: "Resource create operation model.",
        properties: {
          c: { type: "string" },
          all: { type: "string" },
        },
        required: ["all"],
      },
      M: {
        type: "object",
        properties: {
          r: { type: "string", readOnly: true },
          all: { type: "string" },
        },
        required: ["all"],
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
        allOf: [
          {
            $ref: "#/components/schemas/M",
          },
        ],
      },
      DCreate: {
        type: "object",
        allOf: [
          {
            $ref: "#/components/schemas/MCreate",
          },
        ],
      },
      DCreateOrUpdate: {
        type: "object",
        allOf: [
          {
            $ref: "#/components/schemas/MCreateOrUpdate",
          },
        ],
      },
      DDelete: {
        type: "object",
        allOf: [
          {
            $ref: "#/components/schemas/MDelete",
          },
        ],
      },
      DQuery: {
        type: "object",
        allOf: [
          {
            $ref: "#/components/schemas/MQuery",
          },
        ],
      },
      DUpdate: {
        type: "object",
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
      @route("/batch") @get op batch(@bodyRoot _: Parameters[]): string;
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
      @route("/batch") @post op batch(@bodyRoot body?: Parameters[]): string;
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

  it("supports nested metadata", async () => {
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
            {
              $ref: "#/components/parameters/Pet.id",
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
          headers: {
            type: "object",
            properties: {
              moreHeaders: {
                type: "object",
              },
            },
            required: ["moreHeaders"],
          },
          name: {
            type: "string",
          },
        },
        required: ["headers", "name"],
      },
      Pet: {
        type: "object",
        properties: {
          headers: {
            type: "object",
            properties: {
              moreHeaders: {
                type: "object",
              },
            },
            required: ["moreHeaders"],
          },
          id: {
            type: "string",
          },
          name: {
            type: "string",
          },
        },
        required: ["headers", "id", "name"],
      },
    });
  });

  it("supports nested bodies", async () => {
    const res = await openApiFor(
      `
      model Image {
        @header contentType: "application/octet-stream";
        @body body: bytes;
      }
      op doStuffWithBytes(data: Image): int32;
      `
    );

    const requestSchema =
      res.paths["/"].post.requestBody.content["application/octet-stream"].schema;

    deepStrictEqual(requestSchema, { format: "binary", type: "string" });
  });

  it("supports deeply nested bodies", async () => {
    const res = await openApiFor(
      `
      model Image {
        @header contentType: "application/octet-stream";
        moreNesting: { @body body: bytes };
      }
      op doStuffWithBytes(data: Image): int32;
      `
    );

    const requestSchema =
      res.paths["/"].post.requestBody.content["application/octet-stream"].schema;

    deepStrictEqual(requestSchema, { format: "binary", type: "string" });
  });

  it("don't create multiple scalars with different visibility if they are the same", async () => {
    const res = await openApiFor(`
      scalar uuid extends string;

      model Bar {
        id: uuid;
      }
      
      @patch op test(...Bar): Bar;
    `);

    deepStrictEqual(Object.keys(res.components.schemas), ["Bar", "BarUpdate", "uuid"]);
    deepStrictEqual(res.components.schemas.uuid, {
      type: "string",
    });
  });

  it("model referenced via a patch operation and an unreachable types does create 2 schemas", async () => {
    const res = await openApiFor(`
      model Bar {
        id: string;
      }
      
      @patch op test(bar: Bar): void;

      model Foo {
        bar: Bar;
      }
    `);

    deepStrictEqual(res.components.schemas, {
      Bar: {
        type: "object",
        required: ["id"],
        properties: {
          id: {
            type: "string",
          },
        },
      },
      BarUpdate: {
        type: "object",
        properties: {
          id: {
            type: "string",
          },
        },
      },
      Foo: {
        type: "object",
        required: ["bar"],
        properties: {
          bar: {
            $ref: "#/components/schemas/Bar",
          },
        },
      },
    });
  });

  it("base models used in different visibility gets distinct names", async () => {
    const res = await openApiFor(`
      model Widget {
        @visibility("read", "update")
        @path
        id: string;
      
        weight: int32;
      }
      
      model CreatedWidget extends Widget {}
      
      @post op create(widget: Widget): CreatedWidget;
    `);

    deepStrictEqual(Object.keys(res.components.schemas), [
      "CreatedWidget",
      "CreatedWidgetCreate",
      "Widget",
      "WidgetCreate",
    ]);
  });

  it("unreachable models include @path properties", async () => {
    const res = await openApiFor(`
      model Unreachable {
        @path name: string;
      }
    `);

    deepStrictEqual(res.components.schemas.Unreachable, {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
      },
      required: ["name"],
    });
  });

  it("inheritance tree unreachable with @path doesn't get conflicts", async () => {
    const res = await openApiFor(`
      model Base {
      }

      model Child extends Base {
        @path name: string;
      }
    `);

    deepStrictEqual(Object.keys(res.components.schemas), ["Base", "Child"]);
    deepStrictEqual(res.components.schemas.Child, {
      type: "object",
      allOf: [
        {
          $ref: "#/components/schemas/Base",
        },
      ],
      properties: {
        name: {
          type: "string",
        },
      },
      required: ["name"],
    });
  });
});
