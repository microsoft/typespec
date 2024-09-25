import { json, mockapi, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

// string value
Scenarios.Azure_Core_Scalar_AzureLocationScalar_get = passOnSuccess(
  mockapi.get("/azure/core/scalar/azureLocation", (req) => {
    return { status: 200, body: json("eastus") };
  }),
);

Scenarios.Azure_Core_Scalar_AzureLocationScalar_put = passOnSuccess(
  mockapi.put("/azure/core/scalar/azureLocation", (req) => {
    req.expect.bodyEquals("eastus");
    return { status: 204 };
  }),
);

const azureLocation = { location: "eastus" };
Scenarios.Azure_Core_Scalar_AzureLocationScalar_post = passOnSuccess(
  mockapi.post("/azure/core/scalar/azureLocation", (req) => {
    req.expect.bodyEquals({ location: "eastus" });
    return {
      status: 200,
      body: json(azureLocation),
    };
  }),
);

Scenarios.Azure_Core_Scalar_AzureLocationScalar_header = passOnSuccess(
  mockapi.post("/azure/core/scalar/azureLocation/header", (req) => {
    req.expect.containsHeader("region", "eastus");

    return { status: 204 };
  }),
);

Scenarios.Azure_Core_Scalar_AzureLocationScalar_query = passOnSuccess(
  mockapi.post("/azure/core/scalar/azureLocation/query", (req) => {
    req.expect.containsQueryParam("region", "eastus");

    return { status: 204 };
  }),
);

Scenarios.Azure_Core_Scalar_Azure_Location_Query = passOnSuccess({
  uri: "/azure/core/scalar/azureLocation/query",
  mockMethods: [
    {
      method: "post",
      request: {
        config: {
          params: { region: "eastus" },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
});

Scenarios.Azure_Core_Scalar_Azure_Location_Header = passOnSuccess({
  uri: "/azure/core/scalar/azureLocation/header",
  mockMethods: [
    {
      method: "post",
      request: {
        config: {
          headers: {
            region: "eastus",
          },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
});

Scenarios.Azure_Core_Scalar_Azure_Location = passOnSuccess({
  uri: "/azure/core/scalar/azureLocation",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        data: "eastus",
      },
    },
    {
      method: "put",
      request: {
        body: "eastus",
        config: {
          headers: {
            "Content-Type": "text/plain",
          },
        },
      },
      response: {
        status: 204,
      },
    },
    {
      method: "post",
      request: {
        body: { location: "eastus" },
      },
      response: {
        status: 200,
        data: azureLocation,
      },
    },
  ],
});
