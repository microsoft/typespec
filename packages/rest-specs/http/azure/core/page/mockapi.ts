import { passOnSuccess, mockapi, json } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};
const validUser = { id: 1, name: "Madge", etag: "11bdc430-65e8-45ad-81d9-8ffa60d55b59" };

Scenarios.Azure_Core_Page_listWithPage = passOnSuccess(
  mockapi.get("/azure/core/page/page", (req) => {
    const responseBody = {
      value: [validUser],
    };
    return { status: 200, body: json(responseBody) };
  }),
);

Scenarios.Azure_Core_Page_listWithParameters = passOnSuccess(
  mockapi.get("/azure/core/page/parameters", (req) => {
    req.expect.containsQueryParam("another", "Second");

    const validBody = { inputName: "Madge" };
    req.expect.bodyEquals(validBody);

    const responseBody = {
      value: [validUser],
    };
    return { status: 200, body: json(responseBody) };
  }),
);

Scenarios.Azure_Core_Page_TwoModelsAsPageItem = passOnSuccess([
  mockapi.get("/azure/core/page/first-item", () => {
    const responseBody = {
      value: [{ id: 1 }],
    };
    return { status: 200, body: json(responseBody) };
  }),
  mockapi.get("/azure/core/page/second-item", () => {
    const responseBody = {
      value: [{ name: "Madge" }],
    };
    return { status: 200, body: json(responseBody) };
  }),
]);

Scenarios.Azure_Core_Page_listWithCustomPageModel = passOnSuccess(
  mockapi.get("/azure/core/page/custom-page", () => {
    const responseBody = {
      items: [validUser],
    };
    return { status: 200, body: json(responseBody) };
  }),
);

Scenarios.Azure_Core_Page_Page = passOnSuccess({
  uri: "/azure/core/page/page",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        data: {
          value: [validUser],
        },
      },
    },
  ],
});

Scenarios.Azure_Core_Page_Parameters = passOnSuccess({
  uri: "/azure/core/page/parameters",
  mockMethods: [
    {
      method: "get",
      request: {
        config: {
          data: { inputName: "Madge" },
          params: {
            another: "Second",
          },
        },
      },
      response: {
        status: 200,
        data: {
          value: [validUser],
        },
      },
    },
  ],
});

Scenarios.Azure_Core_Page_First_Item = passOnSuccess({
  uri: "/azure/core/page/first-item",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        data: {
          value: [{ id: 1 }],
        },
      },
    },
  ],
});

Scenarios.Azure_Core_Page_Second_Item = passOnSuccess({
  uri: "/azure/core/page/second-item",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        data: {
          value: [{ name: "Madge" }],
        },
      },
    },
  ],
});

Scenarios.Azure_Core_Page_Custom_Page = passOnSuccess({
  uri: "/azure/core/page/custom-page",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        data: {
          items: [validUser],
        },
      },
    },
  ],
});
