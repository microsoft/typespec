import OpenAPIParser from "@scalar/openapi-parser";
import { OpenAPI } from "@scalar/openapi-types";
import { beforeAll, describe, expect, it } from "vitest";
import { createContext } from "../../src/cli/actions/convert/utils/context.js";
import { OpenAPI3Document } from "../../src/types.js";

describe("tsp-openapi: Context methods", () => {
  let parser: OpenAPIParser;
  let doc: OpenAPI.Document<{}>;

  beforeAll(async () => {
    parser = new OpenAPIParser();
    doc = await parser.bundle({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {},
    });
  });

  it("should add a component encoding to the registry", () => {
    const context = createContext(parser, doc as OpenAPI3Document);
    const reference = "#/components/schemas/MySchema";
    const encoding = {
      myProperty: {
        contentType: "application/json",
      },
    };
    context.registerMultipartSchema(reference, encoding);
    expect(context.getMultipartSchemaEncoding(reference)).toEqual(encoding);
    expect(context.isSchemaReferenceRegisteredForMultipartForm(reference)).toBe(true);
  });

  it("should consider a component without encoding to be registered", () => {
    const context = createContext(parser, doc as OpenAPI3Document);
    const reference = "#/components/schemas/MySchema";
    context.registerMultipartSchema(reference);
    expect(context.getMultipartSchemaEncoding(reference)).toBeUndefined();
    expect(context.isSchemaReferenceRegisteredForMultipartForm(reference)).toBe(true);
  });

  it("should NOT consider a component to be registered when it's not", () => {
    const context = createContext(parser, doc as OpenAPI3Document);
    const reference = "#/components/schemas/MySchema";
    expect(context.getMultipartSchemaEncoding(reference)).toBeUndefined();
    expect(context.isSchemaReferenceRegisteredForMultipartForm(reference)).toBe(false);
  });
});
