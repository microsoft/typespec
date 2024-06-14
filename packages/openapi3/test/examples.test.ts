import { describe } from "node:test";
import { expect, it } from "vitest";
import { OpenAPI3Document } from "../src/types.js";
import { openApiFor } from "./test-host.js";

describe("schema examples", () => {
  it("apply example on model", async () => {
    const res = await openApiFor(
      `
      @example(#{name: "John"})
      model Test { name: string }
      `
    );
    expect(res.components.schemas.Test.example).toEqual({ name: "John" });
  });

  it("apply example on property", async () => {
    const res = await openApiFor(
      `
      model Test { @example("John") name: string }
      `
    );
    expect(res.components.schemas.Test.properties.name.example).toEqual("John");
  });

  it("serialize the examples with their json encoding", async () => {
    const res = await openApiFor(
      `
      @example(#{dob: plainDate.fromISO("2021-01-01")})
      model Test { dob: plainDate }
      `
    );
    expect(res.components.schemas.Test.example).toEqual({ dob: "2021-01-01" });
  });
});

describe("operation examples", () => {
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

      `
    );
    expect(res.paths["/"].post?.requestBody.content["application/json"].example).toEqual({
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

      `
    );
    expect(res.paths["/"].post?.requestBody.content["application/json"].examples).toEqual({
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
      `
    );
    expect(res.paths["/"].get?.responses[200].content["application/json"].example).toEqual({
      name: "Fluffy",
      age: 2,
    });
  });
});
