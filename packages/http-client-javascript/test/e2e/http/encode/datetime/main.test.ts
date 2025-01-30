import { describe, expect, it } from "vitest";
import {
  HeaderClient,
  PropertyClient,
  QueryClient,
  ResponseHeaderClient,
} from "../../../generated/http/encode/datetime/http-client-javascript/src/index.js";

describe("Encode.Datetime", () => {
  describe("QueryClient", () => {
    const client = new QueryClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should test default encode (rfc3339) for datetime query parameter", async () => {
      await client.default_(new Date("2022-08-26T18:38:00.000Z"));
      // Assert successful request
    });

    it("should test rfc3339 encode for datetime query parameter", async () => {
      await client.rfc3339(new Date("2022-08-26T18:38:00.000Z"));
      // Assert successful request
    });

    it("should test rfc7231 encode for datetime query parameter", async () => {
      await client.rfc7231(new Date("2022-08-26T14:38:00.000Z"));
      // Assert successful request
    });

    it("should test unixTimestamp encode for datetime query parameter", async () => {
      await client.unixTimestamp(new Date("2023-06-12T14:34:24Z"));
      // Assert successful request
    });

    it("should test unixTimestamp encode for datetime array query parameter", async () => {
      const timestamps = [
        new Date("2023-06-12T06:41:04.000Z"),
        new Date("2023-06-14T11:57:36.000Z"),
      ];
      await client.unixTimestampArray(timestamps);
      // Assert successful request
    });
  });

  describe("PropertyClient", () => {
    const client = new PropertyClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle default encode (rfc3339) for datetime property", async () => {
      const requestBody = { value: new Date("2022-08-26T18:38:00.000Z") };
      const response = await client.default_(requestBody);
      expect(response).toEqual(requestBody);
    });

    it("should handle rfc3339 encode for datetime property", async () => {
      const requestBody = { value: new Date("2022-08-26T18:38:00.000Z") };
      const response = await client.rfc3339(requestBody);
      expect(response).toEqual(requestBody);
    });

    it("should handle rfc7231 encode for datetime property", async () => {
      const requestBody = { value: new Date("2022-08-26T14:38:00.000Z") };
      const response = await client.rfc7231(requestBody);
      expect(response).toEqual(requestBody);
    });

    it("should handle unixTimestamp encode for datetime property", async () => {
      const requestBody = { value: new Date("2023-06-12T06:41:04.000Z") };
      const response = await client.unixTimestamp(requestBody);
      expect(response).toEqual(requestBody);
    });

    it("should handle unixTimestamp encode for datetime array property", async () => {
      const requestBody = {
        value: [new Date("2023-06-12T06:41:04.000Z"), new Date("2023-06-14T11:57:36.000Z")],
      };
      const response = await client.unixTimestampArray(requestBody);
      expect(response).toEqual(requestBody);
    });
  });

  describe("HeaderClient", () => {
    const client = new HeaderClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should test default encode (rfc7231) for datetime header", async () => {
      await client.default_(new Date("2022-08-26T14:38:00.000Z"));
      // Assert successful request
    });

    it("should test rfc3339 encode for datetime header", async () => {
      await client.rfc3339(new Date("2022-08-26T18:38:00.000Z"));
      // Assert successful request
    });

    it("should test rfc7231 encode for datetime header", async () => {
      await client.rfc7231(new Date("2022-08-26T14:38:00.000Z"));
      // Assert successful request
    });

    it("should test unixTimestamp encode for datetime header", async () => {
      await client.unixTimestamp(new Date("2023-06-12T06:41:04.000Z"));
      // Assert successful request
    });

    it("should test unixTimestamp encode for datetime array header", async () => {
      const timestamps = [
        new Date("2023-06-12T06:41:04.000Z"),
        new Date("2023-06-14T11:57:36.000Z"),
      ];
      await client.unixTimestampArray(timestamps);
      // Assert successful request
    });
  });

  describe("ResponseHeaderClient", () => {
    const client = new ResponseHeaderClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle default encode (rfc7231) for datetime response header", async () => {
      const response = await client.default_();
      expect(response.value).toEqual(new Date("2022-08-26T14:38:00.000Z"));
    });

    it("should handle rfc3339 encode for datetime response header", async () => {
      const response = await client.rfc3339();
      expect(response.value).toEqual(new Date("2022-08-26T18:38:00.000Z"));
    });

    it("should handle rfc7231 encode for datetime response header", async () => {
      const response = await client.rfc7231();
      expect(response.value).toEqual(new Date("2022-08-26T14:38:00.000Z"));
    });

    it("should handle unixTimestamp encode for datetime response header", async () => {
      const response = await client.unixTimestamp();
      expect(response.value).toEqual(new Date("2023-06-12T06:41:04.000Z"));
    });
  });
});
