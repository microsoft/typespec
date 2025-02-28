import { readFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { beforeEach, describe, it } from "vitest";
import { FormDataClient, HttpPartsClient } from "../../../generated/payload/multipart/src/index.js";

describe("Payload.MultiPart", () => {
  let __filename;
  let __dirname;
  let jpegContents: Uint8Array;
  let pngContents: Uint8Array;

  describe.skip("FormDataClient", () => {
    const client = new FormDataClient({
      allowInsecureConnection: true,
      retryOptions: { maxRetries: 1 },
    });

    beforeEach(async () => {
      __filename = fileURLToPath(import.meta.url);
      __dirname = dirname(__filename);

      const jpegImagePath = resolve(__dirname, "../../../assets/image.jpg");
      const jpegBuffer = await readFile(jpegImagePath);
      jpegContents = new Uint8Array(jpegBuffer);

      const pngImagePath = resolve(__dirname, "../../../assets/image.png");
      const pngBuffer = await readFile(pngImagePath);
      pngContents = new Uint8Array(pngBuffer);
    });

    it("should send mixed parts with multipart/form-data", async () => {
      await client.basic({
        id: "123",
        profileImage: jpegContents,
      });
    });

    it("should send complex parts with multipart/form-data", async () => {
      const address = { city: "X" };
      await client.fileArrayAndBasic({
        id: "123",
        address,
        profileImage: jpegContents,
        pictures: [pngContents, pngContents],
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
        pictures: [pngContents, pngContents],
      });
    });

    it("should send multi-binary parts multiple times", async () => {
      await client.multiBinaryParts({
        profileImage: jpegContents,
        picture: pngContents,
      });
    });

    it("should send parts and check filename/content-type", async () => {
      await client.checkFileNameAndContentType({
        id: "123",
        profileImage: jpegContents,
      });
    });

    it("should send anonymous model with multipart/form-data", async () => {
      await client.anonymousModel(jpegContents);
    });
  });

  describe.skip("FormDataClient.HttpParts.ContentType", () => {
    const client = new HttpPartsClient({
      allowInsecureConnection: true,
      retryOptions: { maxRetries: 1 },
    });

    it("should handle image/jpeg with specific content type", async () => {
      await client.contentTypeClient.imageJpegContentType({
        profileImage: {
          contents: jpegContents,
          contentType: "image/jpg",
          filename: "image.jpg",
        },
      });
    });

    it("should handle required content type with multipart/form-data", async () => {
      await client.contentTypeClient.requiredContentType({
        profileImage: {
          contents: jpegContents,
          contentType: "image/jpg",
          filename: "image.jpg",
        },
      });
    });

    it("should handle optional content type file parts", async () => {
      await client.contentTypeClient.optionalContentType({
        profileImage: {
          contents: jpegContents,
          filename: "image.jpg",
        },
      });
    });
  });

  describe("FormDataClient.HttpParts", () => {
    it.skip("should send json array and file array", async () => {
      const client = new HttpPartsClient({
        allowInsecureConnection: true,
        retryOptions: {
          maxRetries: 1,
        },
      });
      const address = { city: "X" };
      const previousAddresses = [{ city: "Y" }, { city: "Z" }];
      await client.jsonArrayAndFileArray({
        id: "123",
        address,
        profileImage: {
          contents: jpegContents,
          contentType: "application/octet-stream",
          filename: "profile.jpg",
        },
        previousAddresses,
        pictures: [
          { contents: pngContents, contentType: "application/octet-stream", filename: "pic1.png" },
          { contents: pngContents, contentType: "application/octet-stream", filename: "pic2.png" },
        ],
      });
    });
  });

  describe("FormDataClient.HttpParts.NonString", () => {
    it.skip("should handle non-string float", async () => {
      const client = new HttpPartsClient({
        allowInsecureConnection: true,
        retryOptions: {
          maxRetries: 1,
        },
      });
      await client.nonStringClient.float({
        temperature: {
          body: 0.5,
          contentType: "text/plain",
        },
      });
    });
  });
});
