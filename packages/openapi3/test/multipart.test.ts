import { deepStrictEqual } from "assert";
import { openApiFor } from "./test-host.js";

describe("typespec-autorest: multipart", () => {
  it("add MultiPart suffix to model name", async () => {
    const res = await openApiFor(
      `
      model Form { @header contentType: "multipart/form-data", name: string, profileImage: bytes }
      op upload(...Form): void;
      `
    );
    const op = res.paths["/"].post;
    deepStrictEqual(op.requestBody.content["multipart/form-data"], {
      schema: {
        $ref: "#/components/schemas/FormMultiPart",
      },
    });
  });

  it("part of type `bytes` produce `type: string, format: binary`", async () => {
    const res = await openApiFor(
      `
      op upload(@header contentType: "multipart/form-data", profileImage: bytes): void;
      `
    );
    const op = res.paths["/"].post;
    deepStrictEqual(op.requestBody.content["multipart/form-data"], {
      schema: {
        type: "object",
        properties: {
          profileImage: {
            format: "binary",
            type: "string",
          },
        },
        required: ["profileImage"],
      },
    });
  });

  it("part of type `string` produce `type: string`", async () => {
    const res = await openApiFor(
      `
      op upload(@header contentType: "multipart/form-data", name: string): void;
      `
    );
    const op = res.paths["/"].post;
    deepStrictEqual(op.requestBody.content["multipart/form-data"], {
      schema: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
        },
        required: ["name"],
      },
    });
  });

  it("part of type `object` produce an object", async () => {
    const res = await openApiFor(
      `
      op upload(@header contentType: "multipart/form-data", address: {city: string, street: string}): void;
      `
    );
    const op = res.paths["/"].post;
    deepStrictEqual(op.requestBody.content["multipart/form-data"], {
      schema: {
        type: "object",
        properties: {
          address: {
            type: "object",
            properties: {
              city: {
                type: "string",
              },
              street: {
                type: "string",
              },
            },
            required: ["city", "street"],
          },
        },
        required: ["address"],
      },
    });
  });

  it("bytes inside a json part will be treated as base64 encoded by default(same as for a json body)", async () => {
    const res = await openApiFor(
      `
      op upload(@header contentType: "multipart/form-data", address: {city: string, icon: bytes}): void;
      `
    );
    const op = res.paths["/"].post;
    deepStrictEqual(
      op.requestBody.content["multipart/form-data"].schema.properties.address.properties.icon,
      {
        type: "string",
        format: "byte",
      }
    );
  });

  it("enum used in both a json payload and multipart part shouldn't create 2 models", async () => {
    const res = await openApiFor(
      `
      enum FilePurpose {
        fineTune,
        fineTuneResults,
      }
      
      interface Files {
        @get listFiles(purpose: FilePurpose): string;
        @post uploadFile(@header contentType: "multipart/form-data", purpose: FilePurpose): string;
      }
      `
    );
    deepStrictEqual(res.components.schemas.FilePurpose, {});
  });
});
