import { describe, expect, it } from "vitest";
import {
  ExtendsDifferentSpreadFloatClient,
  ExtendsDifferentSpreadModelArrayClient,
  ExtendsDifferentSpreadModelClient,
  ExtendsDifferentSpreadStringClient,
  ExtendsFloatAdditionalProperties,
  ExtendsFloatClient,
  ExtendsModelAdditionalProperties,
  ExtendsModelArrayAdditionalProperties,
  ExtendsModelArrayClient,
  ExtendsModelClient,
  ExtendsStringAdditionalProperties,
  ExtendsStringClient,
  IsFloatAdditionalProperties,
  IsFloatClient,
  IsModelAdditionalProperties,
  IsModelArrayAdditionalProperties,
  IsModelArrayClient,
  IsModelClient,
  IsStringAdditionalProperties,
  IsStringClient,
  MultipleSpreadClient,
  SpreadDifferentFloatClient,
  SpreadDifferentModelArrayClient,
  SpreadDifferentModelClient,
  SpreadDifferentStringClient,
  SpreadFloatClient,
  SpreadFloatRecord,
  SpreadModelArrayClient,
  SpreadModelArrayRecord,
  SpreadModelClient,
  SpreadModelRecord,
  SpreadRecordNonDiscriminatedUnion2Client,
  SpreadRecordNonDiscriminatedUnion3Client,
  SpreadRecordNonDiscriminatedUnionClient,
  SpreadRecordUnionClient,
  SpreadStringClient,
  SpreadStringRecord,
} from "../../../../generated/type/property/additional-properties/src/index.js";

// Helper to create a client instance with common options.
const clientOptions = {
  allowInsecureConnection: true,
  retryOptions: { maxRetries: 1 },
};

describe("Missing AdditionalProperties Endpoints", () => {
  describe("ExtendsString", () => {
    const client = new ExtendsStringClient(clientOptions);
    const expected: ExtendsStringAdditionalProperties = {
      name: "ExtendsStringAdditionalProperties",
      prop: "abc",
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
    const expected: IsStringAdditionalProperties = {
      name: "IsStringAdditionalProperties",
      prop: "abc",
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
    const expected: SpreadStringRecord = {
      name: "SpreadSpringRecord",
      prop: "abc",
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
    const expected: ExtendsFloatAdditionalProperties = {
      id: 43.125,
      prop: 43.125,
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
    const expected: IsFloatAdditionalProperties = {
      id: 43.125,
      prop: 43.125,
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
    const expected: SpreadFloatRecord = {
      id: 43.125,
      prop: 43.125,
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
    const expected: ExtendsModelAdditionalProperties = {
      knownProp: { state: "ok" },
      prop: { state: "ok" },
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
    const expected: IsModelAdditionalProperties = {
      knownProp: { state: "ok" },
      prop: { state: "ok" },
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
    const expected: SpreadModelRecord = {
      knownProp: { state: "ok" },
      prop: { state: "ok" },
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
    const expected: ExtendsModelArrayAdditionalProperties = {
      knownProp: [{ state: "ok" }, { state: "ok" }],
      prop: [{ state: "ok" }, { state: "ok" }],
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
    const expected: IsModelArrayAdditionalProperties = {
      knownProp: [{ state: "ok" }, { state: "ok" }],
      prop: [{ state: "ok" }, { state: "ok" }],
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
    const expected: SpreadModelArrayRecord = {
      knownProp: [{ state: "ok" }, { state: "ok" }],
      prop: [{ state: "ok" }, { state: "ok" }],
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
      prop: "abc",
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected as any);
    });
  });

  describe("SpreadDifferentFloatClient", () => {
    const client = new SpreadDifferentFloatClient(clientOptions);
    const expected = {
      name: "abc",
      prop: 43.125,
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected as any);
    });
  });

  describe("SpreadDifferentModel", () => {
    const client = new SpreadDifferentModelClient(clientOptions);
    const expected = {
      knownProp: "abc",
      prop: { state: "ok" },
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected as any);
    });
  });

  describe("SpreadDifferentModelArrayClient", () => {
    const client = new SpreadDifferentModelArrayClient(clientOptions);
    const expected = {
      knownProp: "abc",
      prop: [{ state: "ok" }, { state: "ok" }],
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected as any);
    });
  });

  describe("ExtendsDifferentSpreadString", () => {
    const client = new ExtendsDifferentSpreadStringClient(clientOptions);
    const expected = {
      id: 43.125,
      prop: "abc",
      derivedProp: "abc",
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected as any);
    });
  });

  describe("ExtendsDifferentSpreadFloat", () => {
    const client = new ExtendsDifferentSpreadFloatClient(clientOptions);
    const expected = {
      name: "abc",
      prop: 43.125,
      derivedProp: 43.125,
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected as any);
    });
  });

  describe("ExtendsDifferentSpreadModel", () => {
    const client = new ExtendsDifferentSpreadModelClient(clientOptions);
    const expected = {
      knownProp: "abc",
      prop: { state: "ok" },
      derivedProp: { state: "ok" },
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected as any);
    });
  });

  describe("ExtendsDifferentSpreadModelArray", () => {
    const client = new ExtendsDifferentSpreadModelArrayClient(clientOptions);
    const expected = {
      knownProp: "abc",
      prop: [{ state: "ok" }, { state: "ok" }],
      derivedProp: [{ state: "ok" }, { state: "ok" }],
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected as any);
    });
  });

  // Multiple spread tests
  describe("MultipleSpreadRecord", () => {
    const client = new MultipleSpreadClient(clientOptions);
    const expected = {
      flag: true,
      prop1: "abc",
      prop2: 43.125,
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected as any);
    });
  });

  describe("SpreadRecordUnion", () => {
    const client = new SpreadRecordUnionClient(clientOptions);
    const expected = {
      flag: true,
      prop1: "abc",
      prop2: 43.125,
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected as any);
    });
  });

  describe("SpreadRecordNonDiscriminatedUnion", () => {
    const client = new SpreadRecordNonDiscriminatedUnionClient(clientOptions);
    const expected = {
      name: "abc",
      prop1: { kind: "kind0", fooProp: "abc" },
      prop2: {
        kind: "kind1",
        start: "2021-01-01T00:00:00Z",
        end: "2021-01-02T00:00:00Z",
      },
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected as any);
    });
  });

  describe("SpreadRecordNonDiscriminatedUnion2", () => {
    const client = new SpreadRecordNonDiscriminatedUnion2Client(clientOptions);
    const expected = {
      name: "abc",
      prop1: { kind: "kind1", start: "2021-01-01T00:00:00Z" },
      prop2: {
        kind: "kind1",
        start: "2021-01-01T00:00:00Z",
        end: "2021-01-02T00:00:00Z",
      },
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected as any);
    });
  });

  describe("SpreadRecordNonDiscriminatedUnion3", () => {
    const client = new SpreadRecordNonDiscriminatedUnion3Client(clientOptions);
    const expected = {
      name: "abc",
      prop1: [
        { kind: "kind1", start: "2021-01-01T00:00:00Z" },
        { kind: "kind1", start: "2021-01-01T00:00:00Z" },
      ],
      prop2: {
        kind: "kind1",
        start: "2021-01-01T00:00:00Z",
        end: "2021-01-02T00:00:00Z",
      },
    };
    it("GET returns the expected response", async () => {
      const response = await client.get();
      expect(response).toEqual(expected);
    });
    it("PUT accepts the expected input", async () => {
      await client.put(expected as any);
    });
  });
});
