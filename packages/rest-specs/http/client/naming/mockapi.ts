import { passOnSuccess, mockapi } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Client_Naming_Property_client = passOnSuccess(
  mockapi.post("/client/naming/property/client", (req) => {
    req.expect.bodyEquals({ defaultName: true });
    return {
      status: 204,
    };
  }),
);

Scenarios.Client_Naming_Property_language = passOnSuccess(
  mockapi.post("/client/naming/property/language", (req) => {
    req.expect.bodyEquals({ defaultName: true });
    return {
      status: 204,
    };
  }),
);

Scenarios.Client_Naming_Property_compatibleWithEncodedName = passOnSuccess(
  mockapi.post("/client/naming/property/compatible-with-encoded-name", (req) => {
    req.expect.bodyEquals({ wireName: true });
    return {
      status: 204,
    };
  }),
);

Scenarios.Client_Naming_operation = passOnSuccess(
  mockapi.post("/client/naming/operation", (req) => {
    return {
      status: 204,
    };
  }),
);

Scenarios.Client_Naming_parameter = passOnSuccess(
  mockapi.post("/client/naming/parameter", (req) => {
    req.expect.containsQueryParam("defaultName", "true");
    return {
      status: 204,
    };
  }),
);

Scenarios.Client_Naming_Header_request = passOnSuccess(
  mockapi.post("/client/naming/header", (req) => {
    req.expect.containsHeader("default-name", "true");
    return {
      status: 204,
    };
  }),
);

Scenarios.Client_Naming_Header_response = passOnSuccess(
  mockapi.get("/client/naming/header", (req) => {
    return {
      status: 204,
      headers: {
        "default-name": "true",
      },
    };
  }),
);

Scenarios.Client_Naming_Model_client = passOnSuccess(
  mockapi.post("/client/naming/model/client", (req) => {
    req.expect.bodyEquals({ defaultName: true });
    return {
      status: 204,
    };
  }),
);

Scenarios.Client_Naming_Model_language = passOnSuccess(
  mockapi.post("/client/naming/model/language", (req) => {
    req.expect.bodyEquals({ defaultName: true });
    return {
      status: 204,
    };
  }),
);

Scenarios.Client_Naming_UnionEnum_unionEnumName = passOnSuccess(
  mockapi.post("/client/naming/union-enum/union-enum-name", (req) => {
    req.expect.bodyEquals("value1");
    return {
      status: 204,
    };
  }),
);

Scenarios.Client_Naming_UnionEnum_unionEnumMemberName = passOnSuccess(
  mockapi.post("/client/naming/union-enum/union-enum-member-name", (req) => {
    req.expect.bodyEquals("value1");
    return {
      status: 204,
    };
  }),
);

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
    },
  ],
});
