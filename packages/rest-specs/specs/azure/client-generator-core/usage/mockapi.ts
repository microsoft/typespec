import { json, mockapi, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Azure_ClientGenerator_Core_Usage_ModelInOperation = passOnSuccess([
  mockapi.post("/azure/client-generator-core/usage/inputToInputOutput", (req) => {
    const validBody = { name: "Madge" };
    req.expect.bodyEquals(validBody);
    return { status: 204 };
  }),
  mockapi.get("/azure/client-generator-core/usage/outputToInputOutput", (req) => {
    return {
      status: 200,
      body: json({ name: "Madge" }),
    };
  }),
  mockapi.put("/azure/client-generator-core/usage/modelInReadOnlyProperty", (req) => {
    return {
      status: 200,
      body: json({ result: { name: "Madge" } }),
    };
  }),
]);

Scenarios.Azure_Client_Generator_Core_Usage_Input_To_Input = passOnSuccess({
  uri: "/azure/client-generator-core/usage/inputToInputOutput",
  mockMethods: [
    {
      method: "post",
      request: {
        body: { name: "Madge" },
      },
      response: {
        status: 204,
      },
    },
  ],
});

Scenarios.Azure_Client_Generator_Core_Usage_Output_To_Input = passOnSuccess({
  uri: "/azure/client-generator-core/usage/outputToInputOutput",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        data: { name: "Madge" },
      },
    },
  ],
});

Scenarios.Azure_Client_Generator_Core_Usage_Model_In_ReadOnly = passOnSuccess({
  uri: "/azure/client-generator-core/usage/modelInReadOnlyProperty",
  mockMethods: [
    {
      method: "put",
      request: {},
      response: {
        status: 200,
        data: { result: { name: "Madge" } },
      },
    },
  ],
});
