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

// Test data with inheritance (models extend Pet base)
const catWithInheritanceData = {
  name: "Whiskers",
  meow: true,
};

const dogWithInheritanceData = {
  name: "Rex",
  bark: false,
};

// Test data with property conflicts (models have "kind" property)
const catWithConflictData = {
  name: "Whiskers",
  meow: true,
  kind: "cat",
};

const dogWithConflictData = {
  name: "Rex",
  bark: false,
  kind: "dog",
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

Scenarios.Type_Union_Discriminated_Envelope_Object_Default_getDefault = passOnSuccess({
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

Scenarios.Type_Union_Discriminated_Envelope_Object_Default_putDefault = passOnSuccess({
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

Scenarios.Type_Union_Discriminated_Envelope_Object_CustomProperties_getCustomProperties =
  passOnSuccess({
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

Scenarios.Type_Union_Discriminated_Envelope_Object_CustomProperties_putCustomProperties =
  passOnSuccess({
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

// Envelope discriminated union with inheritance
const envelopeInheritanceCatBody = {
  kind: "cat",
  value: catWithInheritanceData,
};

const envelopeInheritanceDogBody = {
  kind: "dog",
  value: dogWithInheritanceData,
};

Scenarios.Type_Union_Discriminated_Envelope_Object_Inheritance_getInheritance = passOnSuccess({
  uri: "/type/union/discriminated/envelope/object/inheritance",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json(envelopeInheritanceCatBody),
  },
  handler: (req: MockRequest) => {
    const kind = req.query.kind as string | undefined;

    if (kind === "dog") {
      return {
        status: 200,
        body: json(envelopeInheritanceDogBody),
      };
    } else {
      return {
        status: 200,
        body: json(envelopeInheritanceCatBody),
      };
    }
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Union_Discriminated_Envelope_Object_Inheritance_putInheritance = passOnSuccess({
  uri: "/type/union/discriminated/envelope/object/inheritance",
  method: "put",
  request: {
    body: json(envelopeInheritanceCatBody),
  },
  response: {
    status: 200,
    body: json(envelopeInheritanceCatBody),
  },
  kind: "MockApiDefinition",
});

// Envelope discriminated union with conflicts
const envelopeConflictCatBody = {
  kind: "cat",
  value: catWithConflictData,
};

const envelopeConflictDogBody = {
  kind: "dog",
  value: dogWithConflictData,
};

Scenarios.Type_Union_Discriminated_Envelope_Object_Conflict_getConflict = passOnSuccess({
  uri: "/type/union/discriminated/envelope/object/conflict",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json(envelopeConflictCatBody),
  },
  handler: (req: MockRequest) => {
    const kind = req.query.kind as string | undefined;

    if (kind === "dog") {
      return {
        status: 200,
        body: json(envelopeConflictDogBody),
      };
    } else {
      return {
        status: 200,
        body: json(envelopeConflictCatBody),
      };
    }
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Union_Discriminated_Envelope_Object_Conflict_putConflict = passOnSuccess({
  uri: "/type/union/discriminated/envelope/object/conflict",
  method: "put",
  request: {
    body: json(envelopeConflictCatBody),
  },
  response: {
    status: 200,
    body: json(envelopeConflictCatBody),
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

Scenarios.Type_Union_Discriminated_NoEnvelope_Default_getDefault = passOnSuccess({
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

Scenarios.Type_Union_Discriminated_NoEnvelope_Default_putDefault = passOnSuccess({
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

Scenarios.Type_Union_Discriminated_NoEnvelope_CustomDiscriminator_getCustomDiscriminator =
  passOnSuccess({
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

Scenarios.Type_Union_Discriminated_NoEnvelope_CustomDiscriminator_putCustomDiscriminator =
  passOnSuccess({
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

// No-envelope discriminated union with inheritance
const inlineInheritanceCatBody = {
  kind: "cat",
  name: "Whiskers",
  meow: true,
};

const inlineInheritanceDogBody = {
  kind: "dog",
  name: "Rex",
  bark: false,
};

Scenarios.Type_Union_Discriminated_NoEnvelope_Inheritance_getInheritance = passOnSuccess({
  uri: "/type/union/discriminated/no-envelope/inheritance",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json(inlineInheritanceCatBody),
  },
  handler: (req: MockRequest) => {
    const kind = req.query.kind as string | undefined;

    if (kind === "dog") {
      return {
        status: 200,
        body: json(inlineInheritanceDogBody),
      };
    } else {
      return {
        status: 200,
        body: json(inlineInheritanceCatBody),
      };
    }
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Union_Discriminated_NoEnvelope_Inheritance_putInheritance = passOnSuccess({
  uri: "/type/union/discriminated/no-envelope/inheritance",
  method: "put",
  request: {
    body: json(inlineInheritanceCatBody),
  },
  response: {
    status: 200,
    body: json(inlineInheritanceCatBody),
  },
  kind: "MockApiDefinition",
});

// No-envelope discriminated union with conflicts
const inlineConflictCatBody = {
  kind: "cat",
  name: "Whiskers",
  meow: true,
};

const inlineConflictDogBody = {
  kind: "dog",
  name: "Rex",
  bark: false,
};

Scenarios.Type_Union_Discriminated_NoEnvelope_Conflict_getConflict = passOnSuccess({
  uri: "/type/union/discriminated/no-envelope/conflict",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json(inlineConflictCatBody),
  },
  handler: (req: MockRequest) => {
    const kind = req.query.kind as string | undefined;

    if (kind === "dog") {
      return {
        status: 200,
        body: json(inlineConflictDogBody),
      };
    } else {
      return {
        status: 200,
        body: json(inlineConflictCatBody),
      };
    }
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Union_Discriminated_NoEnvelope_Conflict_putConflict = passOnSuccess({
  uri: "/type/union/discriminated/no-envelope/conflict",
  method: "put",
  request: {
    body: json(inlineConflictCatBody),
  },
  response: {
    status: 200,
    body: json(inlineConflictCatBody),
  },
  kind: "MockApiDefinition",
});
