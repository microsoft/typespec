import { describe, expect, it } from "vitest";
import { OpenAPI3Document, OpenAPI3Parameter, OpenAPI3RequestBody } from "../src/types.js";
import { openApiFor } from "./test-host.js";
import { worksFor } from "./works-for.js";

describe("schema examples", () => {
  it("apply example on model", async () => {
    const res = await openApiFor(
      `
      @example(#{name: "John"})
      model Test { name: string }
      `,
    );
    expect(res.components.schemas.Test.example).toEqual({ name: "John" });
  });

  it("apply example on property", async () => {
    const res = await openApiFor(
      `
      model Test { @example("John") name: string }
      `,
    );
    expect(res.components.schemas.Test.properties.name.example).toEqual("John");
  });

  it("serialize the examples with their json encoding", async () => {
    const res = await openApiFor(
      `
      @example(#{dob: plainDate.fromISO("2021-01-01")})
      model Test { dob: plainDate }
      `,
    );
    expect(res.components.schemas.Test.example).toEqual({ dob: "2021-01-01" });
  });

  it("enum in union", async () => {
    const res = await openApiFor(
      `
      enum Types {a, b}

      model A { type: Types;}

      union Un { A }

      @example(#{ prop: #{ type: Types.a } })
      model Test {
        prop: Un;
      }

      `,
    );
    expect(res.components.schemas.Test.example).toEqual({ prop: { type: "a" } });
  });
});

worksFor(["3.0.0", "3.1.0"], ({ openApiFor }) => {
  it("set example on the request body", async () => {
    const res: OpenAPI3Document = await openApiFor(
      `
      @opExample(#{
        parameters: #{
          name: "Fluffy",
          age: 2,
        },
      })
      op createPet(name: string, age: int32): void;

      `,
    );
    expect(
      (res.paths["/"].post?.requestBody as OpenAPI3RequestBody).content["application/json"].example,
    ).toEqual({
      name: "Fluffy",
      age: 2,
    });
  });

  it("set examples on the request body if example has a title or description", async () => {
    const res: OpenAPI3Document = await openApiFor(
      `
      @opExample(#{
        parameters: #{
          name: "Fluffy",
          age: 2,
        },
        
      }, #{ title: "MyExample" })
      op createPet(name: string, age: int32): void;

      `,
    );
    expect(
      (res.paths["/"].post?.requestBody as OpenAPI3RequestBody).content["application/json"]
        .examples,
    ).toEqual({
      MyExample: {
        summary: "MyExample",
        value: {
          name: "Fluffy",
          age: 2,
        },
      },
    });
  });

  it("set example on the response body", async () => {
    const res: OpenAPI3Document = await openApiFor(
      `
      @opExample(#{
        returnType: #{
          name: "Fluffy",
          age: 2,
        },
      })
      op getPet(): {name: string, age: int32};
      `,
    );
    expect(res.paths["/"].get?.responses[200].content["application/json"].example).toEqual({
      name: "Fluffy",
      age: 2,
    });
  });

  describe("Map to the right status code", () => {
    it("set example on the corresponding response body with union", async () => {
      const res: OpenAPI3Document = await openApiFor(
        `
        @opExample(#{
          returnType: #{
            name: "Fluffy",
            age: 2,
          },
        }, #{ title: "Ok" })
        @opExample(
          #{ returnType: #{ _: 404, error: "No user with this name" } },
          #{ title: "Not found" }
        )
        op getPet(): {name: string, age: int32} | {
          @statusCode _: 404;
          error: string;
        };
        `,
      );
      expect(res.paths["/"].get?.responses[200].content["application/json"].examples).toEqual({
        Ok: {
          summary: "Ok",
          value: { name: "Fluffy", age: 2 },
        },
      });
      expect(res.paths["/"].get?.responses[404].content["application/json"].examples).toEqual({
        "Not found": {
          summary: "Not found",
          value: {
            error: "No user with this name",
          },
        },
      });
    });

    it("apply to status code ranges", async () => {
      const res: OpenAPI3Document = await openApiFor(
        `
        @opExample(#{
          returnType: #{ statusCode: 200, data: "Ok" },
        }, #{ title: "Ok" })
        @opExample(
          #{ returnType: #{ statusCode: 404, error: "No user with this name" } },
          #{ title: "Not found" }
        )
        op getPet(): {@statusCode statusCode: 200, data: string} | {
          @minValue(400)
          @maxValue(599)
          @statusCode
          statusCode: int32;

          error: string;
        };

        `,
      );
      expect(res.paths["/"].get?.responses[200].content["application/json"].examples).toEqual({
        Ok: {
          summary: "Ok",
          value: { data: "Ok" },
        },
      });
      expect(res.paths["/"].get?.responses["4XX"].content["application/json"].examples).toEqual({
        "Not found": {
          summary: "Not found",
          value: {
            error: "No user with this name",
          },
        },
      });
    });
  });

  it("set example on the response body when using @body", async () => {
    const res: OpenAPI3Document = await openApiFor(
      `
      @opExample(#{
        returnType: #{
          pet: #{
            name: "Fluffy",
            age: 2,
          }
        },
      })
      op getPet(): {@body pet: {name: string, age: int32}};
      `,
    );
    expect(res.paths["/"].get?.responses[200].content["application/json"].example).toEqual({
      name: "Fluffy",
      age: 2,
    });
  });

  it("set example on the response body when using @bodyRoot", async () => {
    const res: OpenAPI3Document = await openApiFor(
      `
      @opExample(#{
        returnType: #{
          pet: #{
            name: "Fluffy",
            age: 2,
          }
        },
      })
      op getPet(): {@bodyRoot pet: {name: string, age: int32}};
      `,
    );
    expect(res.paths["/"].get?.responses[200].content["application/json"].example).toEqual({
      name: "Fluffy",
      age: 2,
    });
  });

  it("does not set examples on parameters by default", async () => {
    const res = await openApiFor(
      `
                @opExample(#{
                  parameters: #{
                    color: "blue",
                  },
                })
                @route("/")
                op getColors(@query color: string): void;
              `,
    );
    expect((res.paths["/"].get?.parameters[0] as OpenAPI3Parameter).example).toBeUndefined();
    expect((res.paths["/"].get?.parameters[0] as OpenAPI3Parameter).examples).toBeUndefined();
  });

  describe.each(["path", "query", "header", "cookie"])(
    "set example on the %s parameter without serialization",
    (paramType) => {
      it.each([
        {
          param: `@${paramType} color: string | null`,
          paramExample: `null`,
          expectedExample: null,
        },
        {
          param: `@${paramType} color: string | null`,
          paramExample: `"blue"`,
          expectedExample: "blue",
        },
        {
          param: `@${paramType} color: string[]`,
          paramExample: `#["blue", "black", "brown"]`,
          expectedExample: ["blue", "black", "brown"],
        },
        {
          param: `@${paramType} color: Record<int32>`,
          paramExample: `#{R: 100, G: 200, B: 150}`,
          expectedExample: { R: 100, G: 200, B: 150 },
        },
      ])("$paramExample", async ({ param, paramExample, expectedExample }) => {
        const path = paramType === "path" ? "/{color}" : "/";
        const res = await openApiFor(
          `
                @opExample(#{
                  parameters: #{
                    color: ${paramExample},
                  },
                })
                @route("/")
                op getColors(${param}): void;
              `,
          { "experimental-parameter-examples": "data" },
        );
        expect((res.paths[path].get?.parameters[0] as OpenAPI3Parameter).example).toEqual(
          expectedExample,
        );
      });
    },
  );

  describe("set example on the query parameter with serialization enabled", () => {
    it.each([
      {
        desc: "form (undefined)",
        param: `@query color: string | null`,
        paramExample: `null`,
        expectedExample: "color=",
      },
      {
        desc: "form (string)",
        param: `@query color: string`,
        paramExample: `"blue"`,
        expectedExample: "color=blue",
      },
      {
        desc: "form (array) explode: false",
        param: `@query color: string[]`,
        paramExample: `#["blue", "black", "brown"]`,
        expectedExample: "color=blue,black,brown",
      },
      {
        desc: "form (array) explode: true",
        param: `@query(#{ explode: true }) color: string[]`,
        paramExample: `#["blue", "black", "brown"]`,
        expectedExample: "color=blue&color=black&color=brown",
      },
      {
        desc: "form (object) explode: false",
        param: `@query color: Record<int32>`,
        paramExample: `#{R: 100, G: 200, B: 150}`,
        expectedExample: "color=R,100,G,200,B,150",
      },
      {
        desc: "form (object) explode: true",
        param: `@query(#{ explode: true }) color: Record<int32>`,
        paramExample: `#{R: 100, G: 200, B: 150}`,
        expectedExample: "R=100&G=200&B=150",
      },
      {
        desc: "spaceDelimited (undefined)",
        param: `@query @encode(ArrayEncoding.spaceDelimited) color: string | null`,
        paramExample: `null`,
        expectedExample: undefined,
      },
      {
        desc: "spaceDelimited (string)",
        param: `@query @encode(ArrayEncoding.spaceDelimited) color: string`,
        paramExample: `"blue"`,
        expectedExample: undefined,
      },
      {
        desc: "spaceDelimited (array) explode: false",
        param: `@query @encode(ArrayEncoding.spaceDelimited) color: string[]`,
        paramExample: `#["blue", "black", "brown"]`,
        expectedExample: "color=blue%20black%20brown",
      },
      {
        desc: "spaceDelimited (array) explode: true",
        param: `@query(#{ explode: true }) @encode(ArrayEncoding.spaceDelimited) color: string[]`,
        paramExample: `#["blue", "black", "brown"]`,
        expectedExample: undefined,
      },
      {
        desc: "spaceDelimited (object) explode: false",
        param: `@query @encode(ArrayEncoding.spaceDelimited) color: Record<int32>`,
        paramExample: `#{R: 100, G: 200, B: 150}`,
        expectedExample: "color=R%20100%20G%20200%20B%20150",
      },
      {
        desc: "spaceDelimited (object) explode: true",
        param: `@query(#{ explode: true }) @encode(ArrayEncoding.spaceDelimited) color: Record<int32>`,
        paramExample: `#{R: 100, G: 200, B: 150}`,
        expectedExample: undefined,
      },
      {
        desc: "pipeDelimited (undefined)",
        param: `@query @encode(ArrayEncoding.pipeDelimited) color: string | null`,
        paramExample: `null`,
        expectedExample: undefined,
      },
      {
        desc: "pipeDelimited (string)",
        param: `@query @encode(ArrayEncoding.pipeDelimited) color: string`,
        paramExample: `"blue"`,
        expectedExample: undefined,
      },
      {
        desc: "pipeDelimited (array) explode: false",
        param: `@query @encode(ArrayEncoding.pipeDelimited) color: string[]`,
        paramExample: `#["blue", "black", "brown"]`,
        // cspell:disable-next-line
        expectedExample: "color=blue%7Cblack%7Cbrown",
      },
      {
        desc: "pipeDelimited (array) explode: true",
        param: `@query(#{ explode: true }) @encode(ArrayEncoding.pipeDelimited) color: string[]`,
        paramExample: `#["blue", "black", "brown"]`,
        expectedExample: undefined,
      },
      {
        desc: "pipeDelimited (object) explode: false",
        param: `@query @encode(ArrayEncoding.pipeDelimited) color: Record<int32>`,
        paramExample: `#{R: 100, G: 200, B: 150}`,
        expectedExample: "color=R%7C100%7CG%7C200%7CB%7C150",
      },
      {
        desc: "pipeDelimited (object) explode: true",
        param: `@query(#{ explode: true }) @encode(ArrayEncoding.pipeDelimited) color: Record<int32>`,
        paramExample: `#{R: 100, G: 200, B: 150}`,
        expectedExample: undefined,
      },
    ])("$desc", async ({ param, paramExample, expectedExample }) => {
      const res = await openApiFor(
        `
          @opExample(#{
            parameters: #{
              color: ${paramExample},
            },
          })
          @route("/")
          op getColors(${param}): void;
          `,
        { "experimental-parameter-examples": "serialized" },
      );
      expect((res.paths[`/`].get?.parameters[0] as OpenAPI3Parameter).example).toEqual(
        expectedExample,
      );
    });
  });

  describe("set example on the path parameter with serialization enabled", () => {
    it.each([
      {
        desc: "simple (undefined)",
        route: "/{color}",
        param: `@path color: string | null`,
        paramExample: `null`,
        expectedExample: "",
      },
      {
        desc: "simple (string)",
        route: "/{color}",
        param: `@path color: string`,
        paramExample: `"blue"`,
        expectedExample: "blue",
      },
      {
        desc: "simple (array) explode: false",
        route: "/{color}",
        param: `@path color: string[]`,
        paramExample: `#["blue", "black", "brown"]`,
        expectedExample: "blue,black,brown",
      },
      {
        desc: "simple (array) explode: true",
        route: "/{color*}",
        param: `@path color: string[]`,
        paramExample: `#["blue", "black", "brown"]`,
        expectedExample: "blue,black,brown",
      },
      {
        desc: "simple (object) explode: false",
        route: "/{color}",
        param: `@path color: Record<int32>`,
        paramExample: `#{R: 100, G: 200, B: 150}`,
        expectedExample: "R,100,G,200,B,150",
      },
      {
        desc: "simple (object) explode: true",
        route: "/{color*}",
        param: `@path color: Record<int32>`,
        paramExample: `#{R: 100, G: 200, B: 150}`,
        expectedExample: "R=100,G=200,B=150",
      },
      {
        desc: "matrix (undefined)",
        route: "/{;color}",
        param: `@path color: string | null`,
        paramExample: `null`,
        expectedExample: ";color",
      },
      {
        desc: "matrix (string)",
        route: "/{;color}",
        param: `@path color: string`,
        paramExample: `"blue"`,
        expectedExample: ";color=blue",
      },
      {
        desc: "matrix (array) explode: false",
        route: "/{;color}",
        param: `@path color: string[]`,
        paramExample: `#["blue", "black", "brown"]`,
        expectedExample: ";color=blue,black,brown",
      },
      {
        desc: "matrix (array) explode: true",
        route: "/{;color*}",
        param: `@path color: string[]`,
        paramExample: `#["blue", "black", "brown"]`,
        expectedExample: ";color=blue;color=black;color=brown",
      },
      {
        desc: "matrix (object) explode: false",
        route: "/{;color}",
        param: `@path color: Record<int32>`,
        paramExample: `#{R: 100, G: 200, B: 150}`,
        expectedExample: ";color=R,100,G,200,B,150",
      },
      {
        desc: "matrix (object) explode: true",
        route: "/{;color*}",
        param: `@path color: Record<int32>`,
        paramExample: `#{R: 100, G: 200, B: 150}`,
        expectedExample: ";R=100;G=200;B=150",
      },
      {
        desc: "label (undefined)",
        route: "/{.color}",
        param: `@path color: string | null`,
        paramExample: `null`,
        expectedExample: ".",
      },
      {
        desc: "label (string)",
        route: "/{.color}",
        param: `@path color: string`,
        paramExample: `"blue"`,
        expectedExample: ".blue",
      },
      {
        desc: "label (array) explode: false",
        route: "/{.color}",
        param: `@path color: string[]`,
        paramExample: `#["blue", "black", "brown"]`,
        expectedExample: ".blue,black,brown",
      },
      {
        desc: "label (array) explode: true",
        route: "/{.color*}",
        param: `@path color: string[]`,
        paramExample: `#["blue", "black", "brown"]`,
        expectedExample: ".blue.black.brown",
      },
      {
        desc: "label (object) explode: false",
        route: "/{.color}",
        param: `@path color: Record<int32>`,
        paramExample: `#{R: 100, G: 200, B: 150}`,
        expectedExample: ".R,100,G,200,B,150",
      },
      {
        desc: "label (object) explode: true",
        route: "/{.color*}",
        param: `@path color: Record<int32>`,
        paramExample: `#{R: 100, G: 200, B: 150}`,
        expectedExample: ".R=100.G=200.B=150",
      },
    ])("$desc", async ({ param, route, paramExample, expectedExample }) => {
      const res: OpenAPI3Document = await openApiFor(
        `
          @opExample(#{
            parameters: #{
              color: ${paramExample},
            },
          })
          @route("${route}")
          op getColors(${param}): void;
          `,
        { "experimental-parameter-examples": "serialized" },
      );
      expect((res.paths[`/{color}`].get?.parameters[0] as OpenAPI3Parameter).example).toEqual(
        expectedExample,
      );
    });
  });

  describe("set example on the header parameter with serialization enabled", () => {
    it.each([
      {
        desc: "simple (undefined)",
        param: `@header color: string | null`,
        paramExample: `null`,
        expectedExample: "",
      },
      {
        desc: "simple (string)",
        param: `@header color: string`,
        paramExample: `"blue"`,
        expectedExample: "blue",
      },
      {
        desc: "simple (array) explode: false",
        param: `@header color: string[]`,
        paramExample: `#["blue", "black", "brown"]`,
        expectedExample: "blue,black,brown",
      },
      {
        desc: "simple (array) explode: true",
        param: `@header(#{ explode: true }) color: string[]`,
        paramExample: `#["blue", "black", "brown"]`,
        expectedExample: "blue,black,brown",
      },
      {
        desc: "simple (object) explode: false",
        param: `@header color: Record<int32>`,
        paramExample: `#{R: 100, G: 200, B: 150}`,
        expectedExample: "R,100,G,200,B,150",
      },
      {
        desc: "simple (object) explode: true",
        param: `@header(#{ explode: true }) color: Record<int32>`,
        paramExample: `#{R: 100, G: 200, B: 150}`,
        expectedExample: "R=100,G=200,B=150",
      },
    ])("$desc", async ({ param, paramExample, expectedExample }) => {
      const res: OpenAPI3Document = await openApiFor(
        `
          @opExample(#{
            parameters: #{
              color: ${paramExample},
            },
          })
          @route("/")
          op getColors(${param}): void;
          `,
        { "experimental-parameter-examples": "serialized" },
      );
      expect((res.paths[`/`].get?.parameters[0] as OpenAPI3Parameter).example).toEqual(
        expectedExample,
      );
    });
  });

  describe("set example on the cookie parameter with serialization enabled", () => {
    it.each([
      {
        desc: "form (undefined)",
        param: `@cookie color: string | null`,
        paramExample: `null`,
        expectedExample: "color=",
      },
      {
        desc: "form (string)",
        param: `@cookie color: string`,
        paramExample: `"blue"`,
        expectedExample: "color=blue",
      },
      {
        desc: "form (array) explode: false",
        param: `@cookie color: string[]`,
        paramExample: `#["blue", "black", "brown"]`,
        expectedExample: "color=blue,black,brown",
      },
      {
        desc: "form (object) explode: false",
        param: `@cookie color: Record<int32>`,
        paramExample: `#{R: 100, G: 200, B: 150}`,
        expectedExample: "color=R,100,G,200,B,150",
      },
    ])("$desc", async ({ param, paramExample, expectedExample }) => {
      const res: OpenAPI3Document = await openApiFor(
        `
          @opExample(#{
            parameters: #{
              color: ${paramExample},
            },
          })
          @route("/")
          op getColors(${param}): void;
          `,
        { "experimental-parameter-examples": "serialized" },
      );
      expect((res.paths[`/`].get?.parameters[0] as OpenAPI3Parameter).example).toEqual(
        expectedExample,
      );
    });
  });

  it("supports multiple examples on parameter with serialization enabled", async () => {
    const res = await openApiFor(
      `
          @opExample(#{
            parameters: #{
              color: "green",
            },
          }, #{ title: "MyExample" })
          @opExample(#{
            parameters: #{
              color: "red",
            },
          }, #{ title: "MyExample2" })
          @route("/")
          op getColors(@query color: string): void;
          `,
      { "experimental-parameter-examples": "serialized" },
    );
    expect((res.paths[`/`].get?.parameters[0] as OpenAPI3Parameter).examples).toEqual({
      MyExample: {
        summary: "MyExample",
        value: "color=green",
      },
      MyExample2: {
        summary: "MyExample2",
        value: "color=red",
      },
    });
  });

  it("supports multiple examples on parameter without serialization enabled", async () => {
    const res = await openApiFor(
      `
          @opExample(#{
            parameters: #{
              color: "green",
            },
          }, #{ title: "MyExample" })
          @opExample(#{
            parameters: #{
              color: "red",
            },
          }, #{ title: "MyExample2" })
          @route("/")
          op getColors(@query color: string): void;
          `,
      { "experimental-parameter-examples": "data" },
    );
    expect((res.paths[`/`].get?.parameters[0] as OpenAPI3Parameter).examples).toEqual({
      MyExample: {
        summary: "MyExample",
        value: "green",
      },
      MyExample2: {
        summary: "MyExample2",
        value: "red",
      },
    });
  });

  it("supports encoding in examples", async () => {
    const res = await openApiFor(
      `
      @opExample(#{
        parameters: #{
          dob: plainDate.fromISO("2021-01-01"),
          utc: utcDateTime.fromISO("2021-01-01T00:00:00Z"),
          utcAsUnix: utcDateTime.fromISO("2021-01-01T00:00:00Z"),
          dur: duration.fromISO("PT1H"),
          defaultHeader: utcDateTime.fromISO("2021-01-01T00:00:00Z"),
          encodedHeader: utcDateTime.fromISO("2021-01-01T00:00:00Z"),
        }
      }, #{ title: "Test Example"})
      @route("/")
      op getDates(...Test): void;

      model Test {
        @query
        dob: plainDate;
        
        @query
        utc: utcDateTime;

        @query
        @encode(DateTimeKnownEncoding.unixTimestamp, int32)
        utcAsUnix: utcDateTime;

        @query
        @encode(DurationKnownEncoding.seconds, int32)
        dur: duration;

        @header
        defaultHeader: utcDateTime;

        @header
        @encode(DateTimeKnownEncoding.rfc3339)
        encodedHeader: utcDateTime;
      }
    `,
      { "experimental-parameter-examples": "data" },
    );
    expect((res.components.parameters["Test.dob"] as OpenAPI3Parameter).examples).toEqual({
      "Test Example": { summary: "Test Example", value: "2021-01-01" },
    });
    expect((res.components.parameters["Test.utc"] as OpenAPI3Parameter).examples).toEqual({
      "Test Example": { summary: "Test Example", value: "2021-01-01T00:00:00Z" },
    });
    expect((res.components.parameters["Test.utcAsUnix"] as OpenAPI3Parameter).examples).toEqual({
      "Test Example": { summary: "Test Example", value: 1609459200 },
    });
    expect((res.components.parameters["Test.dur"] as OpenAPI3Parameter).examples).toEqual({
      "Test Example": { summary: "Test Example", value: 3600 },
    });
    expect((res.components.parameters["Test.defaultHeader"] as OpenAPI3Parameter).examples).toEqual(
      {
        "Test Example": { summary: "Test Example", value: "Fri, 01 Jan 2021 00:00:00 GMT" },
      },
    );
    expect((res.components.parameters["Test.encodedHeader"] as OpenAPI3Parameter).examples).toEqual(
      {
        "Test Example": { summary: "Test Example", value: "2021-01-01T00:00:00Z" },
      },
    );
  });

  it("supports encoding in example", async () => {
    const res = await openApiFor(
      `
      @opExample(#{
        parameters: #{
          dob: plainDate.fromISO("2021-01-01"),
          utc: utcDateTime.fromISO("2021-01-01T00:00:00Z"),
          utcAsUnix: utcDateTime.fromISO("2021-01-01T00:00:00Z"),
          dur: duration.fromISO("PT1H"),
          defaultHeader: utcDateTime.fromISO("2021-01-01T00:00:00Z"),
          encodedHeader: utcDateTime.fromISO("2021-01-01T00:00:00Z"),
        }
      })
      @route("/")
      op getDates(...Test): void;

      model Test {
        @query
        dob: plainDate;
        
        @query
        utc: utcDateTime;

        @query
        @encode(DateTimeKnownEncoding.unixTimestamp, int32)
        utcAsUnix: utcDateTime;

        @query
        @encode(DurationKnownEncoding.seconds, int32)
        dur: duration;

        @header
        defaultHeader: utcDateTime;

        @header
        @encode(DateTimeKnownEncoding.rfc3339)
        encodedHeader: utcDateTime;
      }
    `,
      { "experimental-parameter-examples": "data" },
    );
    expect((res.components.parameters["Test.dob"] as OpenAPI3Parameter).example).toEqual(
      "2021-01-01",
    );
    expect((res.components.parameters["Test.utc"] as OpenAPI3Parameter).example).toEqual(
      "2021-01-01T00:00:00Z",
    );
    expect((res.components.parameters["Test.utcAsUnix"] as OpenAPI3Parameter).example).toEqual(
      1609459200,
    );
    expect((res.components.parameters["Test.dur"] as OpenAPI3Parameter).example).toEqual(3600);
    expect((res.components.parameters["Test.defaultHeader"] as OpenAPI3Parameter).example).toEqual(
      "Fri, 01 Jan 2021 00:00:00 GMT",
    );
    expect((res.components.parameters["Test.encodedHeader"] as OpenAPI3Parameter).example).toEqual(
      "2021-01-01T00:00:00Z",
    );
  });
});
