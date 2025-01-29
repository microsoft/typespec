import { describe, expect, it } from "vitest";
import { PayloadJsonMergePatchClient } from "../../../generated/http/payload/json-merge-patch/http-client-javascript/src/index.js";

describe("Payload.JsonMergePatch", () => {
  const client = new PayloadJsonMergePatchClient("http://localhost:3000");

  it("should handle createResource operation with application/merge-patch+json content type", async () => {
    const requestBody = {
      name: "Madge",
      description: "desc",
      map: {
        key: {
          name: "InnerMadge",
          description: "innerDesc",
        },
      },
      array: [
        {
          name: "InnerMadge",
          description: "innerDesc",
        },
      ],
      intValue: 1,
      floatValue: 1.1,
      innerModel: {
        name: "InnerMadge",
        description: "innerDesc",
      },
      intArray: [1, 2, 3],
    };

    const expectedResponse = {
      name: "Madge",
      description: "desc",
      map: {
        key: {
          name: "InnerMadge",
          description: "innerDesc",
        },
      },
      array: [
        {
          name: "InnerMadge",
          description: "innerDesc",
        },
      ],
      intValue: 1,
      floatValue: 1.1,
      innerModel: {
        name: "InnerMadge",
        description: "innerDesc",
      },
      intArray: [1, 2, 3],
    };

    const response = await client.createResource(requestBody);
    expect(response).toEqual(expectedResponse);
  });

  it("should handle updateResource operation with application/merge-patch+json content type", async () => {
    const requestBody = {
      description: null,
      map: {
        key: {
          description: null,
        },
        key2: null,
      },
      array: null,
      intValue: null,
      floatValue: null,
      innerModel: null,
      intArray: null,
    };

    const expectedResponse = {
      name: "Madge",
      map: {
        key: {
          name: "InnerMadge",
        },
      },
    };

    const response = await client.updateResource(
      "application/merge-patch+json",
      requestBody,
    );
    expect(response).toEqual(expectedResponse);
  });

  it("should handle updateOptionalResource operation with application/merge-patch+json content type and body provided", async () => {
    const requestBody = {
      description: null,
      map: {
        key: {
          description: null,
        },
        key2: null,
      },
      array: null,
      intValue: null,
      floatValue: null,
      innerModel: null,
      intArray: null,
    };

    const expectedResponse = {
      name: "Madge",
      map: {
        key: {
          name: "InnerMadge",
        },
      },
    };

    const response = await client.updateOptionalResource(
      "application/merge-patch+json",
      requestBody,
    );
    expect(response).toEqual(expectedResponse);
  });

  it("should handle updateOptionalResource operation with application/merge-patch+json content type and no body provided", async () => {
    const expectedResponse = {
      name: "Madge",
      map: {
        key: {
          name: "InnerMadge",
        },
      },
    };

    const response = await client.updateOptionalResource(
      "application/merge-patch+json",
    );
    expect(response).toEqual(expectedResponse);
  });
});
