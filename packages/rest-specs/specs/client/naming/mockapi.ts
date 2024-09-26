import { MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Client_Naming_Property_Client_Server_Test = passOnSuccess({
  uri: `/client/naming/property/client`,
  mockMethods: [
    {
      method: "post",
      request: {
        body: { defaultName: true },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals({ defaultName: true });
        return {
          status: 204,
        };
      },
    },
  ],
});

Scenarios.Client_Naming_Property_Language_Server_Test = passOnSuccess({
  uri: `/client/naming/property/language`,
  mockMethods: [
    {
      method: "post",
      request: {
        body: { defaultName: true },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals({ defaultName: true });
        return {
          status: 204,
        };
      },
    },
  ],
});

Scenarios.Client_Naming_Property_Compatible_Encoded_Name = passOnSuccess({
  uri: `/client/naming/property/compatible-with-encoded-name`,
  mockMethods: [
    {
      method: "post",
      request: {
        body: { wireName: true },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals({ wireName: true });
        return {
          status: 204,
        };
      },
    },
  ],
});

Scenarios.Client_Naming_Operation_Server_Test = passOnSuccess({
  uri: `/client/naming/operation`,
  mockMethods: [
    {
      method: "post",
      request: {},
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        return {
          status: 204,
        };
      },
    },
  ],
});

Scenarios.Client_Naming_Parameter_Server_Test = passOnSuccess({
  uri: `/client/naming/parameter`,
  mockMethods: [
    {
      method: "post",
      request: {
        config: {
          params: { defaultName: "true" },
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.containsQueryParam("defaultName", "true");
        return {
          status: 204,
        };
      },
    },
  ],
});

Scenarios.Client_Naming_Header = passOnSuccess({
  uri: `/client/naming/header`,
  mockMethods: [
    {
      method: "post",
      request: {
        config: {
          headers: { "default-name": "true" },
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader("default-name", "true");
        return {
          status: 204,
        };
      },
    },
    {
      method: "get",
      request: {},
      response: {
        status: 204,
        headers: {
          "default-name": "true",
        },
      },
      handler: (req: MockRequest) => {
        return {
          status: 204,
          headers: {
            "default-name": "true",
          },
        };
      },
    },
  ],
});

Scenarios.Client_Naming_Model_Client_Server_Test = passOnSuccess({
  uri: `/client/naming/model/client`,
  mockMethods: [
    {
      method: "post",
      request: {
        body: { defaultName: true },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals({ defaultName: true });
        return {
          status: 204,
        };
      },
    },
  ],
});

Scenarios.Client_Naming_Model_Language_Server_Test = passOnSuccess({
  uri: `/client/naming/model/language`,
  mockMethods: [
    {
      method: "post",
      request: {
        body: { defaultName: true },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals({ defaultName: true });
        return {
          status: 204,
        };
      },
    },
  ],
});

Scenarios.Client_Naming_Union_Enum_Name = passOnSuccess({
  uri: `/client/naming/union-enum/union-enum-name`,
  mockMethods: [
    {
      method: "post",
      request: {
        body: "value1",
        config: {
          headers: {
            "Content-Type": "text/plain",
          },
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals("value1");
        return {
          status: 204,
        };
      },
    },
  ],
});

Scenarios.Client_Naming_Union_Enum_Member_Name = passOnSuccess({
  uri: `/client/naming/union-enum/union-enum-member-name`,
  mockMethods: [
    {
      method: "post",
      request: {
        body: "value1",
        config: {
          headers: {
            "Content-Type": "text/plain",
          },
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals("value1");
        return {
          status: 204,
        };
      },
    },
  ],
});
