import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

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

Scenarios.Type_Union_Discriminated_Envelope_Object_Default_get = passOnSuccess({
  uri: "/type/union/discriminated/envelope/object/default",
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

Scenarios.Type_Union_Discriminated_Envelope_Object_Default_put = passOnSuccess({
  uri: "/type/union/discriminated/envelope/object/default",
  method: "put",
  request: {
    body: json(envelopeCatBody),
  },
  response: {
    status: 200,
    body: json(envelopeCatBody),
  },
  kind: "MockApiDefinition",
});

// Custom names discriminated union
const customNamesCatBody = {
  petType: "cat",
  petData: catData,
};

const customNamesDogBody = {
  petType: "dog",
  petData: dogData,
};

Scenarios.Type_Union_Discriminated_Envelope_Object_CustomProperties_get = passOnSuccess({
  uri: "/type/union/discriminated/envelope/object/custom-properties",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json(customNamesCatBody),
  },
  handler: (req: MockRequest) => {
    const petType = req.query.petType as string | undefined;

    // When petType is null or "cat", return response for "cat"
    // When petType is "dog", return response for "dog"
    if (petType === "dog") {
      return {
        status: 200,
        body: json(customNamesDogBody),
      };
    } else {
      // Default case: when petType is null, undefined, or "cat"
      return {
        status: 200,
        body: json(customNamesCatBody),
      };
    }
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Union_Discriminated_Envelope_Object_CustomProperties_put = passOnSuccess({
  uri: "/type/union/discriminated/envelope/object/custom-properties",
  method: "put",
  request: {
    body: json(customNamesCatBody),
  },
  response: {
    status: 200,
    body: json(customNamesCatBody),
  },
  kind: "MockApiDefinition",
});

// Inline discriminated union (no envelope)
const inlineCatBody = {
  kind: "cat",
  name: "Whiskers",
  meow: true,
};

const inlineDogBody = {
  kind: "dog",
  name: "Rex",
  bark: false,
};

Scenarios.Type_Union_Discriminated_NoEnvelope_Default_get = passOnSuccess({
  uri: "/type/union/discriminated/no-envelope/default",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json(inlineCatBody),
  },
  handler: (req: MockRequest) => {
    const kind = req.query.kind as string | undefined;

    // When kind is null or "cat", return response for "cat"
    // When kind is "dog", return response for "dog"
    if (kind === "dog") {
      return {
        status: 200,
        body: json(inlineDogBody),
      };
    } else {
      // Default case: when kind is null, undefined, or "cat"
      return {
        status: 200,
        body: json(inlineCatBody),
      };
    }
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Union_Discriminated_NoEnvelope_Default_put = passOnSuccess({
  uri: "/type/union/discriminated/no-envelope/default",
  method: "put",
  request: {
    body: json(inlineCatBody),
  },
  response: {
    status: 200,
    body: json(inlineCatBody),
  },
  kind: "MockApiDefinition",
});

// Inline discriminated union with custom discriminator property name
const inlineCustomCatBody = {
  type: "cat",
  name: "Whiskers",
  meow: true,
};

const inlineCustomDogBody = {
  type: "dog",
  name: "Rex",
  bark: false,
};

Scenarios.Type_Union_Discriminated_NoEnvelope_CustomDiscriminator_get = passOnSuccess({
  uri: "/type/union/discriminated/no-envelope/custom-discriminator",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json(inlineCustomCatBody),
  },
  handler: (req: MockRequest) => {
    const type = req.query.type as string | undefined;

    // When type is null or "cat", return response for "cat"
    // When type is "dog", return response for "dog"
    if (type === "dog") {
      return {
        status: 200,
        body: json(inlineCustomDogBody),
      };
    } else {
      // Default case: when type is null, undefined, or "cat"
      return {
        status: 200,
        body: json(inlineCustomCatBody),
      };
    }
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Union_Discriminated_NoEnvelope_CustomDiscriminator_put = passOnSuccess({
  uri: "/type/union/discriminated/no-envelope/custom-discriminator",
  method: "put",
  request: {
    body: json(inlineCustomCatBody),
  },
  response: {
    status: 200,
    body: json(inlineCustomCatBody),
  },
  kind: "MockApiDefinition",
});
