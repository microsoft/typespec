import { readFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";
import {
  HeaderClient,
  PropertyClient,
  QueryClient,
  RequestBodyClient,
  ResponseBodyClient,
} from "../../../generated/http/encode/bytes/http-client-javascript/src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pngImagePath = resolve(
  __dirname,
  "/home/joheredi/azure/typespec/packages/http-client-javascript/node_modules/@azure-tools/cadl-ranch-specs/assets/image.png",
);
const pngBuffer = await readFile(pngImagePath);
const pngContents = new Uint8Array(pngBuffer);

const base64EncodeToUint8Array = (input: string): Uint8Array => {
  // Encode the string as Base64
  const base64String = btoa(input);

  // Decode Base64 into a binary string
  const binaryString = atob(base64String);

  // Convert the binary string to a Uint8Array
  const uint8Array = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }

  return uint8Array;
};

const encodedTestString = base64EncodeToUint8Array("test");

const str = "test";
const testUint8Array = new Uint8Array([...str].map((char) => char.charCodeAt(0)));

describe("Encode.Bytes", () => {
  describe("QueryClient", () => {
    const client = new QueryClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should test default encode (base64) for bytes query parameter", async () => {
      //
      await client.default_(testUint8Array);
      // Assert successful request
    });

    it("should test base64 encode for bytes query parameter", async () => {
      await client.base64(testUint8Array);
      // Assert successful request
    });

    it("should test base64url encode for bytes query parameter", async () => {
      await client.base64url(testUint8Array);
      // Assert successful request
    });

    it("should test base64url encode for bytes array query parameter", async () => {
      await client.base64urlArray([testUint8Array, testUint8Array]);
      // Assert successful request
    });
  });

  describe("PropertyClient", () => {
    const client = new PropertyClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should test default encode (base64) for bytes properties", async () => {
      const response = await client.default_({ value: encodedTestString });
      expect(response.value).toStrictEqual(encodedTestString);
    });

    it("should test base64 encode for bytes properties", async () => {
      const response = await client.base64({ value: testUint8Array });
      expect(response.value).toStrictEqual(encodedTestString);
    });

    it("should test base64url encode for bytes properties", async () => {
      const response = await client.base64url({ value: testUint8Array });
      expect(response.value).toStrictEqual(encodedTestString);
    });

    it("should test base64url encode for bytes array properties", async () => {
      const response = await client.base64urlArray({
        value: [testUint8Array, testUint8Array],
      });
      expect(response.value).toStrictEqual([testUint8Array, testUint8Array]);
    });
  });

  describe("HeaderClient", () => {
    const client = new HeaderClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should test default encode (base64) for bytes header", async () => {
      await client.default_(testUint8Array);
      // Assert successful request
    });

    it("should test base64 encode for bytes header", async () => {
      await client.base64(testUint8Array);
      // Assert successful request
    });

    it("should test base64url encode for bytes header", async () => {
      await client.base64url(testUint8Array);
      // Assert successful request
    });

    it("should test base64url encode for bytes array header", async () => {
      await client.base64urlArray([encodedTestString, encodedTestString]);
      // Assert successful request
    });
  });

  describe("RequestBodyClient", () => {
    const client = new RequestBodyClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should test default encode (base64) for bytes in JSON body", async () => {
      await client.default_(encodedTestString);
      // Assert successful request
    });

    it("should test application/octet-stream content type with bytes payload", async () => {
      const content = pngContents;
      await client.octetStream(content);
      // Assert successful request
    });

    it("should test custom content type (image/png) with bytes payload", async () => {
      const content = pngContents;
      await client.customContentType(content);
      // Assert successful request
    });

    it("should test base64 encode for bytes body", async () => {
      await client.base64(testUint8Array);
      // Assert successful request
    });

    it("should test base64url encode for bytes body", async () => {
      await client.base64url(testUint8Array);
      // Assert successful request
    });
  });

  describe("ResponseBodyClient", () => {
    const client = new ResponseBodyClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should test default encode (base64) for bytes in JSON body response", async () => {
      const response = await client.default_();
      expect(response).toStrictEqual(encodedTestString);
    });

    it.skip("should test application/octet-stream content type with bytes response", async () => {
      const response = await client.octetStream();
      const expectedContent = pngContents;
      expect(response).toStrictEqual(expectedContent);
    });

    it.skip("should test custom content type (image/png) with bytes response", async () => {
      const response = await client.customContentType();
      const expectedContent = pngContents;
      expect(response).toStrictEqual(expectedContent);
    });

    it("should test base64 encode for bytes response body", async () => {
      const response = await client.base64();
      expect(response).toStrictEqual(encodedTestString);
    });

    it("should test base64url encode for bytes response body", async () => {
      const response = await client.base64url();
      expect(response).toStrictEqual(encodedTestString);
    });
  });
});
