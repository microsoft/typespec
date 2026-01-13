import { dyn, dynItem, json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};
const validUser = { id: 1, name: "Madge", etag: "11bdc430-65e8-45ad-81d9-8ffa60d55b59" };

Scenarios.Azure_Core_Page_listWithPage = passOnSuccess({
  uri: "/azure/core/page/page",
  method: "get",
  request: {},
  response: { status: 200, body: json({ value: [validUser] }) },
  kind: "MockApiDefinition",
});

Scenarios.Azure_Core_Page_listWithParameters = passOnSuccess({
  uri: "/azure/core/page/parameters",
  method: "post",
  request: {
    query: {
      another: "Second",
    },
    body: json({ inputName: "Madge" }),
  },
  response: { status: 200, body: json({ value: [validUser] }) },
  kind: "MockApiDefinition",
});

Scenarios.Azure_Core_Page_TwoModelsAsPageItem = passOnSuccess([
  {
    uri: "/azure/core/page/first-item",
    method: "get",
    request: {},
    response: { status: 200, body: json({ value: [{ id: 1 }] }) },
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/core/page/second-item",
    method: "get",
    request: {},
    response: { status: 200, body: json({ value: [{ name: "Madge" }] }) },
    kind: "MockApiDefinition",
  },
]);

Scenarios.Azure_Core_Page_listWithCustomPageModel = passOnSuccess({
  uri: "/azure/core/page/custom-page",
  method: "get",
  request: {},
  response: { status: 200, body: json({ items: [validUser] }) },
  kind: "MockApiDefinition",
});

Scenarios.Azure_Core_Page_withParameterizedNextLink = passOnSuccess([
  {
    // First page request
    uri: "/azure/core/page/with-parameterized-next-link",
    method: "get",
    request: {
      query: {
        includePending: true,
        select: "name",
      },
    },
    response: {
      status: 200,
      body: json({
        values: [{ id: 1, name: "User1" }],
        nextLink: dyn`${dynItem("baseUrl")}/azure/core/page/with-parameterized-next-link/second-page?select=name`,
      }),
    },
    kind: "MockApiDefinition",
  },
  {
    // Follow-up page request
    uri: "/azure/core/page/with-parameterized-next-link/second-page",
    method: "get",
    request: {
      query: {
        includePending: true,
        select: "name",
      },
    },
    response: {
      status: 200,
      body: json({
        values: [{ id: 2, name: "User2" }],
      }),
    },
    kind: "MockApiDefinition",
  },
]);
