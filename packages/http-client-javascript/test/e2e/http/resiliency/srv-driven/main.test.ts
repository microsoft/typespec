import { describe, it } from "vitest";
import {
  AddOptionalParamClient,
  ServiceDrivenClient,
} from "../../../generated/http/resiliency/srv-driven/http-client-javascript/src/index.js";

describe("Resiliency.ServiceDriven", () => {
  const endpoint = "http://localhost:3000";

  describe("AddOptionalParam", () => {
    it("should call 'fromNone' with apiVersion 'v1' and no parameters", async () => {
      const client = new AddOptionalParamClient(endpoint, { apiVersion: "v1" });
      await client.fromNone();
      // Assert successful request
    });

    it("should call 'fromNone' with apiVersion 'v2' and 'new-parameter'", async () => {
      const client = new AddOptionalParamClient(endpoint, { apiVersion: "v2" });
      await client.fromNone({ newParameter: "new" });
      // Assert successful request
    });

    it("should call 'fromOneRequired' with apiVersion 'v1' and required parameter", async () => {
      const client = new AddOptionalParamClient(endpoint, { apiVersion: "v1" });
      await client.fromOneRequired("required");
      // Assert successful request
    });

    it("should call 'fromOneRequired' with apiVersion 'v2', required parameter and 'new-parameter'", async () => {
      const client = new AddOptionalParamClient(endpoint, { apiVersion: "v2" });
      await client.fromOneRequired("required", { newParameter: "new" });
      // Assert successful request
    });

    it("should call 'fromOneOptional' with apiVersion 'v1' and optional parameter", async () => {
      const client = new AddOptionalParamClient(endpoint, { apiVersion: "v1" });
      await client.fromOneOptional({ parameter: "optional" });
      // Assert successful request
    });

    it("should call 'fromOneOptional' with apiVersion 'v2', optional parameter and 'new-parameter'", async () => {
      const client = new AddOptionalParamClient(endpoint, { apiVersion: "v2" });

      await client.fromOneOptional({
        parameter: "optional",
        newParameter: "new",
      });
      // Assert successful request
    });
  });

  describe("addOperation", () => {
    it("should call 'addOperation' with client spec version 'v1'", async () => {
      const client = new ServiceDrivenClient(endpoint, { apiVersion: "v1" });
      await client.addOperation();
      // Assert successful request
    });

    it("should call 'addOperation' with client spec version 'v2'", async () => {
      const client = new ServiceDrivenClient(endpoint, { apiVersion: "v2" });
      await client.addOperation();
      // Assert successful request
    });
  });
});
