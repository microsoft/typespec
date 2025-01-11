import { readFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { beforeEach, describe, it } from "vitest";
import { HttpPartsClient } from "../../../generated/http/payload/multipart/http-client-javascript/src/index.js";

describe("HttpPartsClient", () => {
  let client: HttpPartsClient;
  let __filename;
  let __dirname;
  let jpegContents: Uint8Array;
  let pngContents: Uint8Array;

  beforeEach(async () => {
    const baseUrl = "http://localhost:3000";
    client = new HttpPartsClient(baseUrl);

    __filename = fileURLToPath(import.meta.url);
    __dirname = dirname(__filename);

    const jpegImagePath = resolve(__dirname, "../../../assets/image.jpg");
    const jpegBuffer = await readFile(jpegImagePath);
    jpegContents = new Uint8Array(jpegBuffer);

    const pngImagePath = resolve(__dirname, "../../../assets/image.png");
    const pngBuffer = await readFile(pngImagePath);
    pngContents = new Uint8Array(pngBuffer);
  });

  it("should send a multipart request with required content type", async () => {
    await client.contentTypeClient.requiredContentType(
      {
        profileImage: {
          contents: jpegContents,
          contentType: "application/octet-stream",
          filename: "image.jpg",
        },
      },
      "multipart/form-data",
    );
  });

  it("should send a multipart request with optional content type", async () => {
    await client.contentTypeClient.optionalContentType(
      {
        profileImage: { contents: jpegContents, filename: "image.jpg" },
      },
      "multipart/form-data",
    );
  });

  it("should send a multipart request with complex parts", async () => {
    await client.jsonArrayAndFileArray(
      {
        id: "123",
        address: { city: "X" },
        profileImage: {
          contents: jpegContents,
          contentType: "application/octet-stream",
          filename: "profile.jpg",
        },
        previousAddresses: [{ city: "Y" }, { city: "Z" }],
        pictures: [
          { contents: pngContents, contentType: "application/octet-stream", filename: "pic1.png" },
          { contents: pngContents, contentType: "application/octet-stream", filename: "pic2.png" },
        ],
      },
      "multipart/form-data",
    );
  });

  it.skip("should send a multipart request with a non-string float value", async () => {
    await client.nonStringClient.float(
      {
        temperature: {
          body: 0.5,
          contentType: "text/plain",
        },
      },
      "multipart/form-data",
    );
  });
});
