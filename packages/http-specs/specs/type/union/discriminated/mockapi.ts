import { json, passOnSuccess, ScenarioMockApi, MockRequest } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

// Test data for discriminated union scenarios
const catData = {
  name: "Whiskers",
  meow: true,
};

const dogData = {
  name: "Rex",
  bark: false,
};

// Envelope discriminated union (default serialization)
const envelopeCatBody = {
  kind: "cat",
  value: catData,
};

const envelopeDogBody = {
  kind: "dog",
  value: dogData,
};

Scenarios.Type_Union_Discriminated_EnvelopeDiscriminated_getEnvelope = passOnSuccess({
  uri: "/type/union/discriminated/envelope",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json(envelopeCatBody),
  },
  handler: (req: MockRequest) => {
    const kind = req.query.kind as string | undefined;
    
    // When kind is null or "cat", return response for "cat"
    // When kind is "dog", return response for "dog"
    if (kind === "dog") {
      return {
        status: 200,
        body: json(envelopeDogBody),
      };
    } else {
      // Default case: when kind is null, undefined, or "cat"
      return {
        status: 200,
        body: json(envelopeCatBody),
      };
    }
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Union_Discriminated_EnvelopeDiscriminated_putEnvelope = passOnSuccess({
  uri: "/type/union/discriminated/envelope",
  method: "put",
  request: {
    body: json(envelopeCatBody),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

// Custom names discriminated union
const customNamesCatBody = {
  petType: "cat",
  petData: catData,
};

Scenarios.Type_Union_Discriminated_CustomNamesDiscriminated_getCustomNames = passOnSuccess({
  uri: "/type/union/discriminated/custom-names",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json(customNamesCatBody),
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Union_Discriminated_CustomNamesDiscriminated_putCustomNames = passOnSuccess({
  uri: "/type/union/discriminated/custom-names",
  method: "put",
  request: {
    body: json(customNamesCatBody),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

// Inline discriminated union (no envelope)
const inlineCatBody = {
  kind: "cat",
  name: "Whiskers",
  meow: true,
};

Scenarios.Type_Union_Discriminated_InlineDiscriminated_getInline = passOnSuccess({
  uri: "/type/union/discriminated/inline",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json(inlineCatBody),
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Union_Discriminated_InlineDiscriminated_putInline = passOnSuccess({
  uri: "/type/union/discriminated/inline",
  method: "put",
  request: {
    body: json(inlineCatBody),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});
