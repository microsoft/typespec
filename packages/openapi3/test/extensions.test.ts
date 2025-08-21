import { ok, strictEqual } from "assert";
import { describe, expect, it } from "vitest";
import { openApiFor } from "./test-host.js";

describe("target", () => {
  it("add to model", async () => {
    const oapi = await openApiFor(`
    @extension("x-model-extension", "foobar")
    model Pet {}
  `);
    ok(oapi.components.schemas.Pet);
    strictEqual(oapi.components.schemas.Pet["x-model-extension"], "foobar");
  });

  it("operation", async () => {
    const oapi = await openApiFor(
      `
    @extension("x-operation-extension", "barbaz")
    op list(): string[];
    `,
    );
    ok(oapi.paths["/"].get);
    strictEqual(oapi.paths["/"].get["x-operation-extension"], "barbaz");
  });

  it("parameter component", async () => {
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
    @route("/Pets") @get op get(... PetId): Pet;
    `,
    );
    ok(oapi.paths["/Pets/{petId}"].get);
    strictEqual(
      oapi.paths["/Pets/{petId}"].get.parameters[0]["$ref"],
      "#/components/parameters/PetId",
    );
    strictEqual(oapi.components.parameters.PetId.name, "petId");
    strictEqual(oapi.components.parameters.PetId["x-parameter-extension"], "foobaz");
  });

  it("adds at root of document when on namespace", async () => {
    const oapi = await openApiFor(
      `
    @extension("x-namespace-extension", "foobar")
    @service namespace Service {};
    `,
    );

    strictEqual(oapi["x-namespace-extension"], "foobar");
  });
});

describe("extension value", () => {
  it.each([
    ["string", `"foo"`, "foo"],
    ["number", `42`, 42],
    ["boolean", `true`, true],
    ["null", `null`, null],
    ["array", `#["foo", 42, true]`, ["foo", 42, true]],
    ["object", `#{foo: "bar"}`, { foo: "bar" }],
    ["enum value", "Direction.Up", "Up", "enum Direction {Up, Down}"],
    ["enum value in object", "#{ dir: Direction.Up }", { dir: "Up" }, "enum Direction {Up, Down}"],
  ])("%s", async (_, value, expected, extra?: string) => {
    const oapi = await openApiFor(
      `
      ${extra ?? ""}
      @extension("x-custom", ${value})
      model Foo {}
      `,
    );
    expect(oapi.components.schemas.Foo["x-custom"]).toEqual(expected);
  });
});

describe("HttpPart extensions", () => {
  it("regular properties and HttpPart properties in same model", async () => {
    const oapi = await openApiFor(`
      model MultipartForm {
        @extension("x-regular", "regular-value")
        regularProp: HttpPart<string>;
        
        @extension("x-httppart", "httppart-value")
        fileProp: HttpPart<bytes>;
      }

      @route("/") @post op upload(
        @header contentType: "multipart/form-data",
        @multipartBody body: MultipartForm
      ): void;
    `);
    
    const schema = oapi.components.schemas.MultipartForm;
    console.log("Full schema:", JSON.stringify(schema, null, 2));
    
    // Check regular property extension
    expect(schema.properties.regularProp["x-regular"]).toEqual("regular-value");
    // Check HttpPart property extension
    expect(schema.properties.fileProp["x-httppart"]).toEqual("httppart-value");
  });

  it("extension on HttpPart should be emitted on schema property", async () => {
    const oapi = await openApiFor(`
      @route("/") @post op upload(
        @header contentType: "multipart/form-data",
        @multipartBody body: {
          /** My doc */
          @extension("x-oaiTypeLabel", "file")
          file: HttpPart<bytes>;
        }
      ): void;
    `);
    
    const schema = oapi.paths["/"].post.requestBody.content["multipart/form-data"].schema;
    console.log("Schema properties:", JSON.stringify(schema.properties, null, 2));
    // First check if doc is working
    expect(schema.properties.file.description).toEqual("My doc");
    // Then check if extension is working
    expect(schema.properties.file["x-oaiTypeLabel"]).toEqual("file");
  });
});
