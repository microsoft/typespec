import {
  MockRequest,
  ScenarioMockApi,
  ValidationError,
  json,
  passOnSuccess,
} from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function handler(req: MockRequest) {
  req.expect.containsQueryParam("maxpagesize", "3");
  const skipToken = req.query["skipToken"];
  if (skipToken === undefined) {
    return {
      pass: "firstPage",
      status: 200,
      body: json({
        value: [{ name: "user5" }, { name: "user6" }, { name: "user7" }],
        nextLink: `${req.baseUrl}/payload/pageable?skipToken=name-user7&maxpagesize=3`,
      }),
    };
  } else if (skipToken === "name-user7") {
    return {
      pass: "secondPage",

      status: 200,
      body: json({ value: [{ name: "user8" }] }),
    };
  } else {
    throw new ValidationError(
      "Unsupported skipToken query parameter",
      `Not provided for first page, "name-user7" for second page`,
      req.query["skipToken"],
    );
  }
}

Scenarios.Payload_Pageable = passOnSuccess({
  uri: "/payload/pageable",
  mockMethods: [
    {
      method: "get",
      request: {
        config: {
          params: {
            maxpagesize: 3,
          },
        },
      },
      response: {
        status: 200,
        data: {
          value: [{ name: "user5" }, { name: "user6" }, { name: "user7" }],
          nextLink: "/payload/pageable?skipToken=name-user7&maxpagesize=3",
        },
      },
      handler: handler,
    },
    {
      method: "get",
      request: {
        config: {
          params: {
            maxpagesize: 3,
            skipToken: "name-user7",
          },
        },
      },
      response: {
        status: 200,
        data: { value: [{ name: "user8" }] },
      },
      handler: handler,
    },
    {
      method: "get",
      request: {
        config: {
          params: {
            maxpagesize: 3,
            skipToken: "name-user10",
          },
          validStatus: 400,
        },
      },
      response: {
        status: 400,
        data: {
          message: "Unsupported skipToken query parameter",
          expected: `Not provided for first page, "name-user7" for second page`,
          actual: "name-user10",
        },
      },
      handler: handler,
    },
  ],
  kind: "MockApiDefinition",
});
