import { describe, expect, it } from "vitest";
import {
  ExtendsDifferentSpreadFloatClient,
  ExtendsDifferentSpreadModelArrayClient,
  ExtendsDifferentSpreadModelClient,
  ExtendsDifferentSpreadStringClient,
  ExtendsFloatClient,
  ExtendsModelArrayClient,
  ExtendsModelClient,
  ExtendsStringClient,
  IsFloatClient,
  IsModelArrayClient,
  IsModelClient,
  IsStringClient,
  MultipleSpreadClient,
  SpreadDifferentFloatClient,
  SpreadDifferentModelArrayClient,
  SpreadDifferentModelClient,
  SpreadDifferentStringClient,
  SpreadFloatClient,
  SpreadModelArrayClient,
  SpreadModelClient,
  SpreadRecordDiscriminatedUnionClient,
  SpreadRecordForDiscriminatedUnion,
  SpreadRecordForNonDiscriminatedUnion,
  SpreadRecordForNonDiscriminatedUnion2,
  SpreadRecordForNonDiscriminatedUnion3,
  SpreadRecordNonDiscriminatedUnion2Client,
  SpreadRecordNonDiscriminatedUnion3Client,
  SpreadRecordNonDiscriminatedUnionClient,
  SpreadRecordUnionClient,
  SpreadStringClient,
} from "../../../../generated/type/property/additional-properties/src/index.js";

// Helper to create a client instance with common options.
const clientOptions = {
  allowInsecureConnection: true,
  retryOptions: { maxRetries: 1 },
};

describe("Missing AdditionalProperties Endpoints", () => {
  describe("ExtendsString", () => {
    const client = new ExtendsStringClient(clientOptions);
    const expected = {
      additionalProperties: { prop: "abc" },
      name: "ExtendsStringAdditionalProperties",
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("IsString", () => {
    const client = new IsStringClient({ allowInsecureConnection: true });
    const expected = {
      additionalProperties: { prop: "abc" },
      name: "IsStringAdditionalProperties",
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("SpreadString", () => {
    const client = new SpreadStringClient({
      allowInsecureConnection: true,
    });
    const expected = {
      additionalProperties: { prop: "abc" },
      name: "SpreadSpringRecord",
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("ExtendsFloat", () => {
    const client = new ExtendsFloatClient(clientOptions);
    const expected = {
      additionalProperties: { prop: 43.125 },
      id: 43.125,
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("IsFloat", () => {
    const client = new IsFloatClient(clientOptions);
    const expected = {
      additionalProperties: { prop: 43.125 },
      id: 43.125,
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("SpreadFloat", () => {
    const client = new SpreadFloatClient(clientOptions);
    const expected = {
      additionalProperties: { prop: 43.125 },
      id: 43.125,
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("ExtendsModel", () => {
    const client = new ExtendsModelClient(clientOptions);
    const expected = {
      knownProp: { state: "ok" },
      additionalProperties: { prop: { state: "ok" } },
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("IsModel", () => {
    const client = new IsModelClient(clientOptions);
    const expected = {
      knownProp: { state: "ok" },
      additionalProperties: { prop: { state: "ok" } },
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("SpreadModel", () => {
    const client = new SpreadModelClient(clientOptions);
    const expected = {
      knownProp: { state: "ok" },
      additionalProperties: { prop: { state: "ok" } },
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("ExtendsModelArray", () => {
    const client = new ExtendsModelArrayClient(clientOptions);
    const expected = {
      knownProp: [{ state: "ok" }, { state: "ok" }],
      additionalProperties: { prop: [{ state: "ok" }, { state: "ok" }] },
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("IsModelArray", () => {
    const client = new IsModelArrayClient(clientOptions);
    const expected = {
      knownProp: [{ state: "ok" }, { state: "ok" }],
      additionalProperties: { prop: [{ state: "ok" }, { state: "ok" }] },
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("SpreadModelArray", () => {
    const client = new SpreadModelArrayClient(clientOptions);
    const expected = {
      knownProp: [{ state: "ok" }, { state: "ok" }],
      additionalProperties: { prop: [{ state: "ok" }, { state: "ok" }] },
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  // Known properties type is different from additional properties type
  describe("SpreadDifferentStringClient", () => {
    const client = new SpreadDifferentStringClient(clientOptions);
    const expected = {
      id: 43.125,
      additionalProperties: { prop: "abc" },
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("SpreadDifferentFloatClient", () => {
    const client = new SpreadDifferentFloatClient(clientOptions);
    const expected = {
      name: "abc",
      additionalProperties: { prop: 43.125 },
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("SpreadDifferentModel", () => {
    const client = new SpreadDifferentModelClient(clientOptions);
    const expected = {
      knownProp: "abc",
      additionalProperties: { prop: { state: "ok" } },
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("SpreadDifferentModelArrayClient", () => {
    const client = new SpreadDifferentModelArrayClient(clientOptions);
    const expected = {
      knownProp: "abc",
      additionalProperties: { prop: [{ state: "ok" }, { state: "ok" }] },
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("ExtendsDifferentSpreadString", () => {
    const client = new ExtendsDifferentSpreadStringClient(clientOptions);
    const expected = {
      id: 43.125,
      additionalProperties: { prop: "abc" },
      derivedProp: "abc",
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("ExtendsDifferentSpreadFloat", () => {
    const client = new ExtendsDifferentSpreadFloatClient(clientOptions);
    const expected = {
      name: "abc",
      additionalProperties: { prop: 43.125 },
      derivedProp: 43.125,
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("ExtendsDifferentSpreadModel", () => {
    const client = new ExtendsDifferentSpreadModelClient(clientOptions);
    const expected = {
      knownProp: "abc",
      additionalProperties: { prop: { state: "ok" } },
      derivedProp: { state: "ok" },
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("ExtendsDifferentSpreadModelArray", () => {
    const client = new ExtendsDifferentSpreadModelArrayClient(clientOptions);
    const expected = {
      knownProp: "abc",
      additionalProperties: { prop: [{ state: "ok" }, { state: "ok" }] },
      derivedProp: [{ state: "ok" }, { state: "ok" }],
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  // Multiple spread tests
  describe("MultipleSpreadRecord", () => {
    const client = new MultipleSpreadClient(clientOptions);
    const expected = {
      flag: true,
      additionalProperties: { prop1: "abc", prop2: 43.125 },
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("SpreadRecordUnion", () => {
    const client = new SpreadRecordUnionClient(clientOptions);
    const expected = {
      flag: true,
      additionalProperties: { prop1: "abc", prop2: 43.125 },
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("SpreadRecordDiscriminatedUnion", () => {
    const client = new SpreadRecordDiscriminatedUnionClient(clientOptions);
    const expected: SpreadRecordForDiscriminatedUnion = {
      name: "abc",
      additionalProperties: {
        prop1: { kind: "kind0", fooProp: "abc" },
        prop2: {
          kind: "kind1",
          start: new Date("2021-01-01T00:00:00Z"),
          end: new Date("2021-01-02T00:00:00Z"),
        },
      },
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("SpreadRecordNonDiscriminatedUnion", () => {
    const client = new SpreadRecordNonDiscriminatedUnionClient(clientOptions);
    const expected: SpreadRecordForNonDiscriminatedUnion = {
      name: "abc",
      additionalProperties: {
        prop1: { kind: "kind0", fooProp: "abc" },
        prop2: {
          kind: "kind1",
          start: "2021-01-01T00:00:00Z",
          end: "2021-01-02T00:00:00Z",
        } as any,
      },
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("SpreadRecordNonDiscriminatedUnion2", () => {
    const client = new SpreadRecordNonDiscriminatedUnion2Client(clientOptions);
    const expected: SpreadRecordForNonDiscriminatedUnion2 = {
      name: "abc",
      additionalProperties: {
        prop1: { kind: "kind1", start: "2021-01-01T00:00:00Z" },
        prop2: {
          kind: "kind1",
          start: "2021-01-01T00:00:00Z",
          end: "2021-01-02T00:00:00Z",
        } as any,
      },
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });

  describe("SpreadRecordNonDiscriminatedUnion3", () => {
    const client = new SpreadRecordNonDiscriminatedUnion3Client(clientOptions);
    const expected: SpreadRecordForNonDiscriminatedUnion3 = {
      name: "abc",
      additionalProperties: {
        prop1: [
          { kind: "kind1", start: "2021-01-01T00:00:00Z" },
          { kind: "kind1", start: "2021-01-01T00:00:00Z" },
        ],
        prop2: {
          kind: "kind1",
          start: "2021-01-01T00:00:00Z",
          end: "2021-01-02T00:00:00Z",
        } as any,
      },
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected);
    });
  });
});
