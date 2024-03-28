import { passOnSuccess, ScenarioMockApi, mockapi, json, MockApi } from "@azure-tools/cadl-ranch-api";

/**
 * Test mock server for `Lro-Basic-TypeSpec` test project.
 */
export const Scenarios: Record<string, ScenarioMockApi> = {};

const projectCreationRequest = {
  description: "foo",
  name: "bar"
};

const projectUpdateRequest = {
  description: "test",
  name: "test"
};

const projectUpdateResponse = {
  id: "123",
  description: "test",
  name: "test"
};

const pullingSuccessResponse = {
  status: "Succeeded"
}

Scenarios.LroBasicTypeSpec_CreateProject = passOnSuccess([
  mockapi.post("/projects", (req) => {
    req.expect.bodyEquals(projectCreationRequest);
    return {
      status: 202,
      headers: { "operation-location": `${req.baseUrl}/lro/post/polling`},
      body: json("On going...")
    };
  }),
  mockapi.get("/lro/post/polling", (req) => {
    return {
      status: 200,
      body: json(pullingSuccessResponse),
    };
  })
]);

Scenarios.LroBasicTypeSpec_UpdateProject = passOnSuccess([
  mockapi.put("/projects/123", (req) => {
    req.expect.bodyEquals(projectUpdateRequest);
    return {
      status: 201,
      headers: { "operation-location": `${req.baseUrl}/lro/put/polling`},
      body: json("On going...")
    };
  }),
  mockapi.get("/lro/put/polling", (req) => {
    return {
      status: 200,
      body: json(pullingSuccessResponse),
    };
  }),
  mockapi.get("/projects/123", (req) => {
    return {
      status: 200,
      body: json(projectUpdateResponse),
    };
  })
]);
;
