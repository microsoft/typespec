import { describe, it } from "vitest";
import { ResiliencyServiceDrivenClient } from "../../../generated/http/resiliency/srv-driven/http-client-javascript/src/index.js";

describe("Resiliency.ServiceDriven", () => {
  const endpoint = "http://localhost:3000";
  const serviceDeploymentVersion = "v2";

  describe("AddOptionalParam", () => {
    const client = new ResiliencyServiceDrivenClient(
      endpoint,
      serviceDeploymentVersion,
    );

    it("should call 'fromNone' with apiVersion 'v1' and no parameters", async () => {
      await client.fromNone("v1");
      // Assert successful request
    });

    it("should call 'fromNone' with apiVersion 'v2' and 'new-parameter'", async () => {
      await client.fromNone("v2", { "new-parameter": "new" });
      // Assert successful request
    });

    it("should call 'fromOneRequired' with apiVersion 'v1' and required parameter", async () => {
      await client.fromOneRequired("v1", { parameter: "required" });
      // Assert successful request
    });

    it("should call 'fromOneRequired' with apiVersion 'v2', required parameter and 'new-parameter'", async () => {
      await client.fromOneRequired("v2", {
        parameter: "required",
        "new-parameter": "new",
      });
      // Assert successful request
    });

    it("should call 'fromOneOptional' with apiVersion 'v1' and optional parameter", async () => {
      await client.fromOneOptional("v1", { parameter: "optional" });
      // Assert successful request
    });

    it("should call 'fromOneOptional' with apiVersion 'v2', optional parameter and 'new-parameter'", async () => {
      await client.fromOneOptional("v2", {
        parameter: "optional",
        "new-parameter": "new",
      });
      // Assert successful request
    });
  });

  describe("addOperation", () => {
    it("should call 'addOperation' with client spec version 'v1'", async () => {
      const client = new ResiliencyServiceDrivenClient(
        endpoint,
        serviceDeploymentVersion,
        "v1",
      );
      await client.addOperation();
      // Assert successful request
    });

    it("should call 'addOperation' with client spec version 'v2'", async () => {
      const client = new ResiliencyServiceDrivenClient(
        endpoint,
        serviceDeploymentVersion,
        "v2",
      );
      await client.addOperation();
      // Assert successful request
    });
  });
});
