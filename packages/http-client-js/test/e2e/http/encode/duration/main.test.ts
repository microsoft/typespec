import { describe, expect, it } from "vitest";
import {
  HeaderClient,
  PropertyClient,
  QueryClient,
} from "../../../generated/encode/duration/src/index.js";

describe("Encode.Duration", () => {
  describe("QueryClient", () => {
    const queryClient = new QueryClient({ allowInsecureConnection: true });

    it("should test default encode for a duration parameter", async () => {
      await queryClient.default_("P40D");
      // Assert successful request
    });

    it("should test iso8601 encode for a duration parameter", async () => {
      await queryClient.iso8601("P40D");
      // Assert successful request
    });

    it.skip("should test int32 seconds encode for a duration parameter", async () => {
      await queryClient.int32Seconds("P40D");
      // Assert successful request
    });

    it.skip("should test float seconds encode for a duration parameter", async () => {
      await queryClient.floatSeconds("PT35.625S");
      // Assert successful request
    });

    it.skip("should test float64 seconds encode for a duration parameter", async () => {
      await queryClient.float64Seconds("PT35.625S");
      // Assert successful request
    });

    it.skip("should test int32 seconds encode for a duration array parameter", async () => {
      await queryClient.int32SecondsArray(["P36D", "P47D"]);
      // Assert successful request
    });
  });

  describe("PropertyClient", () => {
    const propertyClient = new PropertyClient({
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should test default encode for a duration property", async () => {
      const requestBody = { value: "P40D" };
      const response = await propertyClient.default_(requestBody);
      expect(response).toEqual({ value: "P40D" });
    });

    it("should test iso8601 encode for a duration property", async () => {
      const requestBody = { value: "P40D" };
      const response = await propertyClient.iso8601(requestBody);
      expect(response).toEqual({ value: "P40D" });
    });

    it.skip("should test int32 seconds encode for a duration property", async () => {
      const requestBody = { value: "PT36S" };
      const response = await propertyClient.int32Seconds(requestBody);
      expect(response).toEqual({ value: 36 });
    });

    it.skip("should test float seconds encode for a duration property", async () => {
      const requestBody = { value: "PT35.625S" };
      const response = await propertyClient.floatSeconds(requestBody);
      expect(response).toEqual({ value: 35.625 });
    });

    it.skip("should test float64 seconds encode for a duration property", async () => {
      const requestBody = { value: "PT35.625S" };
      const response = await propertyClient.float64Seconds(requestBody);
      expect(response).toEqual({ value: 35.625 });
    });

    it.skip("should test float seconds encode for a duration array property", async () => {
      const requestBody = { value: ["PT35.625S", "PT46.75S"] };
      const response = await propertyClient.floatSecondsArray(requestBody);
      expect(response).toEqual({ value: [35.625, 46.75] });
    });
  });

  describe("HeaderClient", () => {
    const headerClient = new HeaderClient({
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should test default encode for a duration header", async () => {
      await headerClient.default_("P40D");
      // Assert successful request
    });

    it("should test iso8601 encode for a duration header", async () => {
      await headerClient.iso8601("P40D");
      // Assert successful request
    });

    it("should test iso8601 encode for a duration array header", async () => {
      await headerClient.iso8601Array(["P40D", "P50D"]);
      // Assert successful request
    });

    it.skip("should test int32 seconds encode for a duration header", async () => {
      await headerClient.int32Seconds("P40D");
      // Assert successful request
    });

    it.skip("should test float seconds encode for a duration header", async () => {
      await headerClient.floatSeconds("PT35.625S");
      // Assert successful request
    });

    it.skip("should test float64 seconds encode for a duration header", async () => {
      await headerClient.float64Seconds("PT35.625S");
      // Assert successful request
    });
  });
});
