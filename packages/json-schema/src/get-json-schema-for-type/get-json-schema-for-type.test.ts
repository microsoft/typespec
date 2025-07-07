import { Tester } from "#test/tester.js";
import { t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { getJsonSchemaForType } from "./get-json-schema-for-type.js";

describe("getJsonSchemaForType", () => {
  it("get a simple contained schema for a model", async () => {
    const { Test, program } = await Tester.compile(t.code`
      model ${t.model("Test")} {
        prop: string;
      }  
    `);

    const result = getJsonSchemaForType(program, Test);
    expect(result).toEqual({
      type: "object",
      properties: {
        prop: { type: "string" },
      },
      required: ["prop"],
    });
  });

  it("include nested models", async () => {
    const { Test, program } = await Tester.compile(t.code`
      model ${t.model("Test")} {
        other: Other;
      }
      
      model Other { prop: string; }
    `);

    const result = getJsonSchemaForType(program, Test);
    expect(result).toEqual({
      type: "object",
      properties: {
        other: {
          type: "object",
          properties: {
            prop: { type: "string" },
          },
          required: ["prop"],
        },
      },
      required: ["other"],
    });
  });

  it("support self references", async () => {
    const { Test, program } = await Tester.compile(t.code`
      model ${t.model("Test")} {
        node: Node;
      }
      
      /** Node model */
      model Node { parent?: Node; }
    `);

    const result = getJsonSchemaForType(program, Test);
    expect(result).toEqual({
      type: "object",
      properties: {
        node: {
          description: "Node model",
          type: "object",
          properties: {
            parent: { description: "Node model" },
          },
        },
      },
      required: ["node"],
    });
  });
});
