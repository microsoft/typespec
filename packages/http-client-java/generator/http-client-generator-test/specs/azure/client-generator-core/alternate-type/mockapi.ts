import {
  json,
  MockApiDefinition,
  MockBody,
  passOnSuccess,
  ScenarioMockApi,
} from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createMockApiDefinitions(
  route: string,
  body: MockBody,
): [MockApiDefinition, MockApiDefinition] {
  return [
    {
      uri: `/azure/client-generator-core/alternate-type/external/${route}`,
      method: "get",
      response: {
        status: 200,
        body: body,
      },
      kind: "MockApiDefinition",
    },
    {
      uri: `/azure/client-generator-core/alternate-type/external/${route}`,
      method: "put",
      request: {
        body,
      },
      response: { status: 204 },
      kind: "MockApiDefinition",
    },
  ];
}

const feature = {
  type: "Feature",
  geometry: {
    type: "Point",
    coordinates: [-122.25, 37.87],
  },
  properties: {
    name: "A single point of interest",
    category: "landmark",
    elevation: 100,
  },
  id: "feature-1",
};

const modelScenarioTypes = createMockApiDefinitions("model", json(feature));

Scenarios.Azure_ClientGenerator_Core_AlternateType_ExternalType_getModel = passOnSuccess(
  modelScenarioTypes[0],
);
Scenarios.Azure_ClientGenerator_Core_AlternateType_ExternalType_putModel = passOnSuccess(
  modelScenarioTypes[1],
);

const modelWithFeatureProperty = {
  feature,
  additionalProperty: "extra",
};

const modelPropertyScenarioTypes = createMockApiDefinitions(
  "property",
  json(modelWithFeatureProperty),
);

Scenarios.Azure_ClientGenerator_Core_AlternateType_ExternalType_getProperty = passOnSuccess(
  modelPropertyScenarioTypes[0],
);
Scenarios.Azure_ClientGenerator_Core_AlternateType_ExternalType_putProperty = passOnSuccess(
  modelPropertyScenarioTypes[1],
);
