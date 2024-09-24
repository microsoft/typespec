import {
  json,
  mockapi,
  MockApi,
  passOnSuccess,
  ScenarioMockApi,
  ValidationError,
} from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createMockApis(route: string): MockApi {
  const url = `/azure/client-generator-core/access/${route}`;
  return mockapi.get(url, (req) => {
    if (!("name" in req.query)) {
      throw new ValidationError("Should submit name query", "any string", undefined);
    }
    return {
      status: 200,
      body: json({ name: req.query["name"] }),
    };
  });
}

Scenarios.Azure_ClientGenerator_Core_Access_PublicOperation = passOnSuccess([
  createMockApis("publicOperation/noDecoratorInPublic"),
  createMockApis("publicOperation/publicDecoratorInPublic"),
]);

Scenarios.Azure_ClientGenerator_Core_Access_InternalOperation = passOnSuccess([
  createMockApis("internalOperation/noDecoratorInInternal"),
  createMockApis("internalOperation/internalDecoratorInInternal"),
  createMockApis("internalOperation/publicDecoratorInInternal"),
]);

Scenarios.Azure_ClientGenerator_Core_Access_SharedModelInOperation = passOnSuccess([
  createMockApis("sharedModelInOperation/public"),
  createMockApis("sharedModelInOperation/internal"),
]);

Scenarios.Azure_ClientGenerator_Core_Access_RelativeModelInOperation = passOnSuccess([
  mockapi.get("/azure/client-generator-core/access/relativeModelInOperation/operation", (req) => {
    if (!("name" in req.query)) {
      throw new ValidationError("Should submit name query", "any string", undefined);
    }
    return {
      status: 200,
      body: json({ name: "Madge", inner: { name: "Madge" } }),
    };
  }),
  mockapi.get(
    "/azure/client-generator-core/access/relativeModelInOperation/discriminator",
    (req) => {
      if (!("kind" in req.query)) {
        throw new ValidationError("Should submit name query", "any string", undefined);
      }
      return {
        status: 200,
        body: json({ name: "Madge", kind: "real" }),
      };
    },
  ),
]);

function createServerTests(uri: string, responseData: any) {
  return passOnSuccess({
    uri: uri,
    mockMethods: [
      {
        method: "get",
        request: {
          config: {
            params: { name: "myname", kind: "real" },
          },
        },
        response: {
          status: 200,
          data: responseData,
        },
      },
    ],
  });
}

Scenarios.Azure_ClientGenerator_Core_Access_PublicOperation_NoDecInPublic = createServerTests(
  "/azure/client-generator-core/access/publicOperation/noDecoratorInPublic",
  { name: "myname" },
);
Scenarios.Azure_ClientGenerator_Core_Access_PublicOperation_PublicDecInPublic = createServerTests(
  "/azure/client-generator-core/access/publicOperation/publicDecoratorInPublic",
  { name: "myname" },
);
Scenarios.Azure_ClientGenerator_Core_Access_InternalOperation_NoDecInInternal = createServerTests(
  "/azure/client-generator-core/access/internalOperation/noDecoratorInInternal",
  { name: "myname" },
);
Scenarios.Azure_ClientGenerator_Core_Access_InternalOperation_InternalDecInInternal =
  createServerTests(
    "/azure/client-generator-core/access/internalOperation/internalDecoratorInInternal",
    { name: "myname" },
  );
Scenarios.Azure_ClientGenerator_Core_Access_InternalOperation_PublicDecInInternal =
  createServerTests(
    "/azure/client-generator-core/access/internalOperation/publicDecoratorInInternal",
    { name: "myname" },
  );
Scenarios.Azure_ClientGenerator_Core_Access_SharedModelInOperation_Public = createServerTests(
  "/azure/client-generator-core/access/sharedModelInOperation/public",
  { name: "myname" },
);
Scenarios.Azure_ClientGenerator_Core_Access_SharedModelInOperation_Internal = createServerTests(
  "/azure/client-generator-core/access/sharedModelInOperation/internal",
  { name: "myname" },
);
Scenarios.Azure_ClientGenerator_Core_Access_RelativeModelInOperation_Operation = createServerTests(
  "/azure/client-generator-core/access/relativeModelInOperation/operation",
  { name: "Madge", inner: { name: "Madge" } },
);
Scenarios.Azure_ClientGenerator_Core_Access_RelativeModelInOperation_Discriminator =
  createServerTests("/azure/client-generator-core/access/relativeModelInOperation/discriminator", {
    name: "Madge",
    kind: "real",
  });
