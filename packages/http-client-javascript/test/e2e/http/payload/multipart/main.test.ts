import { describe, it } from "vitest";
import {
  FormDataClient,
  ComplexHttpPartsModelRequest,
  FileWithHttpPartSpecificContentTypeRequest,
  FileWithHttpPartOptionalContentTypeRequest,
  FileWithHttpPartRequiredContentTypeRequest,
  NonStringFloatClient,
} from "../../../generated/http/payload/multipart/http-client-javascript/src/index.js";

describe("Payload.MultiPart", () => {
  describe("FormDataClient", () => {
    const client = new FormDataClient("http://localhost:3000");

    it("should send mixed parts with multipart/form-data", async () => {
      await client.basic({
        id: "123",
        profileImage: new Uint8Array([
          /* file content */
        ]),
      });
    });

    it("should send complex parts with multipart/form-data", async () => {
      const address = { city: "X" };
      await client.fileArrayAndBasic({
        id: "123",
        address,
        profileImage: new Uint8Array([
          /* file content */
        ]),
        pictures: [
          new Uint8Array([
            /* file content */
          ]),
          new Uint8Array([
            /* file content */
          ]),
        ],
      });
    });

    it("should send json part with binary part", async () => {
      const address = { city: "X" };
      await client.jsonPart({
        address,
        profileImage: new Uint8Array([
          /* file content */
        ]),
      });
    });

    it("should send binary array parts with multipart/form-data", async () => {
      await client.binaryArrayParts({
        id: "123",
        pictures: [
          new Uint8Array([
            /* file content */
          ]),
          new Uint8Array([
            /* file content */
          ]),
        ],
      });
    });

    it("should send multi-binary parts multiple times", async () => {
      // First request with only profileImage
      await client.multiBinaryParts({
        profileImage: new Uint8Array([
          /* file content */
        ]),
      });

      // Second request with profileImage and picture
      await client.multiBinaryParts({
        profileImage: new Uint8Array([
          /* file content */
        ]),
        picture: new Uint8Array([
          /* file content */
        ]),
      });
    });

    it("should send parts and check filename/content-type", async () => {
      await client.checkFileNameAndContentType({
        id: "123",
        profileImage: new Uint8Array([
          /* file content */
        ]),
      });
    });

    it("should send anonymous model with multipart/form-data", async () => {
      await client.anonymousModel(
        new Uint8Array([
          /* file content */
        ]),
      );
    });
  });

  describe("FormDataClient.HttpParts.ContentType", () => {
    const client = new FormDataClient.HttpParts.ContentTypeClient(
      "http://localhost:3000",
    );

    it("should handle image/jpeg with specific content type", async () => {
      await client.imageJpegContentType({
        profileImage: {
          content: new Uint8Array([
            /* file content */
          ]),
          filename: "hello.jpg",
          contentType: "image/jpg",
        },
      });
    });

    it("should handle required content type with multipart/form-data", async () => {
      await client.requiredContentType({
        profileImage: {
          content: new Uint8Array([
            /* file content */
          ]),
          filename: "file.jpg",
          contentType: "application/octet-stream",
        },
      });
    });

    it("should handle optional content type file parts", async () => {
      // First time with no content-type
      await client.optionalContentType({
        profileImage: {
          content: new Uint8Array([
            /* file content */
          ]),
          filename: "file.jpg",
        },
      });

      // Second time with content-type as application/octet-stream
      await client.optionalContentType({
        profileImage: {
          content: new Uint8Array([
            /* file content */
          ]),
          filename: "file.jpg",
          contentType: "application/octet-stream",
        },
      });
    });
  });

  describe("FormDataClient.HttpParts", () => {
    it("should send json array and file array", async () => {
      const client = new FormDataClient.HttpPartsClient(
        "http://localhost:3000",
      );
      const address = { city: "X" };
      const previousAddresses = [{ city: "Y" }, { city: "Z" }];
      await client.jsonArrayAndFileArray({
        id: "123",
        address: { content: address },
        profileImage: {
          content: new Uint8Array([
            /* file content */
          ]),
          filename: "profile.jpg",
          contentType: "application/octet-stream",
        },
        previousAddresses: { content: previousAddresses },
        pictures: [
          {
            content: new Uint8Array([
              /* file content */
            ]),
            filename: "pic1.png",
            contentType: "application/octet-stream",
          },
          {
            content: new Uint8Array([
              /* file content */
            ]),
            filename: "pic2.png",
            contentType: "application/octet-stream",
          },
        ],
      });
    });
  });

  describe("FormDataClient.HttpParts.NonString", () => {
    it("should handle non-string float", async () => {
      const client = new NonStringFloatClient("http://localhost:3000");
      await client.float({
        temperature: { content: 0.5 },
      });
    });
  });
});
