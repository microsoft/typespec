import { describe, expect, it } from "vitest";
import {
  HeaderClient,
  PropertyClient,
  QueryClient,
  ResponseHeaderClient,
} from "../../../generated/encode/datetime/src/index.js";

describe("Encode.Datetime", () => {
  describe("QueryClient", () => {
    const client = new QueryClient({ allowInsecureConnection: true });

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
      // For QueryClient, the correct unixTimestamp date is unchanged.
      await client.unixTimestamp(new Date("2023-06-12T10:47:44Z"));
      // Assert successful request.
    });

    it("should test unixTimestamp encode for datetime array query parameter", async () => {
      // For QueryClient, the array dates remain as before.
      const timestamps = [new Date("2023-06-12T10:47:44Z"), new Date("2023-06-14T09:17:36Z")];
      await client.unixTimestampArray(timestamps);
      // Assert successful request
    });
  });

  describe("PropertyClient", () => {
    const client = new PropertyClient({ allowInsecureConnection: true });

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
      // Use a fixed date string for clarity.
      const requestBody = { value: new Date("Fri, 26 Aug 2022 14:38:00 GMT") };
      const response = await client.rfc7231(requestBody);
      expect(response).toEqual(requestBody);
    });

    it.skip("should handle unixTimestamp encode for datetime property", async () => {
      // Correct property unixTimestamp date.
      const requestBody = { value: new Date("2023-06-12T06:41:04.000Z") };
      const response = await client.unixTimestamp(requestBody);
      expect(response).toEqual(requestBody);
    });

    it.skip("should handle unixTimestamp encode for datetime array property", async () => {
      // Correct property unixTimestamp-array dates.
      const requestBody = {
        value: [new Date("2023-06-12T06:41:04.000Z"), new Date("2023-06-14T11:57:36.000Z")],
      };
      const response = await client.unixTimestampArray(requestBody);
      expect(response).toEqual(requestBody);
    });
  });

  describe("HeaderClient", () => {
    const client = new HeaderClient({ allowInsecureConnection: true });

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

    it.skip("should test unixTimestamp encode for datetime header", async () => {
      // Correct should test default encode (base64) for bytes query parameterheader unixTimestamp date.
      await client.unixTimestamp(new Date("2023-06-12T06:41:04.000Z"));
      // Assert successful request
    });

    it.skip("should test unixTimestamp encode for datetime array header", async () => {
      // Correct header unixTimestamp-array dates.
      const timestamps = [
        new Date("2023-06-12T06:41:04.000Z"),
        new Date("2023-06-14T11:57:36.000Z"),
      ];
      await client.unixTimestampArray(timestamps);
      // Assert successful request
    });
  });

  describe("ResponseHeaderClient", () => {
    const client = new ResponseHeaderClient({
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle default encode (rfc7231) for datetime response header", async () => {
      let value;
      await client.default_({
        operationOptions: {
          onResponse: (r) => {
            value = new Date((r.headers as any)["value"]);
          },
        },
      });
      expect(value).toEqual(new Date("2022-08-26T14:38:00.000Z"));
    });

    it("should handle rfc3339 encode for datetime response header", async () => {
      let value;

      await client.rfc3339({
        operationOptions: {
          onResponse: (r) => {
            value = new Date((r.headers as any)["value"]);
          },
        },
      });
      expect(value).toEqual(new Date("2022-08-26T18:38:00.000Z"));
    });

    it("should handle rfc7231 encode for datetime response header", async () => {
      let value;

      await client.rfc3339({
        operationOptions: {
          onResponse: (r) => {
            value = new Date((r.headers as any)["value"]);
          },
        },
      });
      expect(value).toEqual(new Date("2022-08-26T18:38:00.000Z"));
    });

    it("should handle unixTimestamp encode for datetime response header", async () => {
      let value;

      // Correct response header unixTimestamp date.
      await client.rfc3339({
        operationOptions: {
          onResponse: (r) => {
            value = r.headers["value"];
          },
        },
      });
      expect(value).toEqual("2022-08-26T18:38:00.000Z");
    });
  });
});
