import { describe, it, expect } from "vitest";
import {
  VersioningAddedClient,
  InterfaceV2Client,
} from "../../../generated/http/versioning/added/http-client-javascript/src/index.js";

describe("Versioning.Added", () => {
  const client = new VersioningAddedClient("http://localhost:3000", {
    version: "v2",
  });

  it("should send and receive v1 operation with ModelV1 at latest version", async () => {
    const body = {
      prop: "foo",
      enumProp: "enumMemberV2",
      unionProp: 10,
    };
    const response = await client.v1(body, { headerV2: "bar" });
    expect(response).toEqual(body);
  });

  it("should send and receive v2 operation with ModelV2 at latest version", async () => {
    const body = {
      prop: "foo",
      enumProp: "enumMember",
      unionProp: "bar",
    };
    const response = await client.v2(body);
    expect(response).toEqual(body);
  });

  describe("InterfaceV2Client", () => {
    const interfaceV2Client = new InterfaceV2Client("http://localhost:3000", {
      version: "v2",
    });

    it("should send and receive v2InInterface operation with ModelV2", async () => {
      const body = {
        prop: "foo",
        enumProp: "enumMember",
        unionProp: "bar",
      };
      const response = await interfaceV2Client.v2InInterface(body);
      expect(response).toEqual(body);
    });
  });
});
