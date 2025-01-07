import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Payload_Pageable_ServerDrivenPagination_link = passOnSuccess([
  {
    uri: "/payload/pageable/server-driven-pagination/link",
    method: "get",
    request: {},
    response: {
      status: 200,
      body: json({
        pets: [
          { id: "1", name: "dog" },
          { id: "2", name: "cat" },
        ],
        links: {
          next: "/payload/pageable/server-driven-pagination/link/nextPage",
        },
      }),
    },
    handler: (req: MockRequest) => {
      return {
        status: 200,
        body: json({
          pets: [
            { id: "1", name: "dog" },
            { id: "2", name: "cat" },
          ],
          links: {
            next: `${req.baseUrl}/payload/pageable/server-driven-pagination/link/nextPage`,
          },
        }),
      };
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/payload/pageable/server-driven-pagination/link/nextPage",
    method: "get",
    request: {},
    response: {
      status: 200,
      body: json({
        pets: [
          { id: "3", name: "bird" },
          { id: "4", name: "fish" },
        ],
      }),
    },
    kind: "MockApiDefinition",
  },
]);
