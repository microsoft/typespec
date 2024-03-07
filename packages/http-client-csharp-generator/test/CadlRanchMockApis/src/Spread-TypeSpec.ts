import { passOnSuccess, ScenarioMockApi, mockapi } from "@azure-tools/cadl-ranch-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const spreadModelRequest = {
    name: "dog",
    age: 3
};

const spreadAliasRequest = {
    name: "dog",
    age: 3
};

const spreadMultiTargetAliasRequest = {
    name: "dog",
    age: 3
};

const spreadAliasWithModelRequest = {
    name: "dog",
    age: 3
};

const spreadAliasWithSpreadAliasRequest = {
    name: "dog",
    age: 3
};

const spreadAliasWithoutOptionalPropRequest = {
    name: "dog",
    items: [1, 2, 3],
};

const spreadAliasWithOptionalPropRequest = {
    name: "dog",
    color: "red",
    age: 3,
    items: [1, 2, 3, 4],
    elements: ["a", "b"]
};

const spreadAliasWithRequiredAndOptionalCollections = {
    requiredStringList: ["a", "b"],
    optionalStringList: ["c", "d"]
};

Scenarios.Spread_SpreadModel = passOnSuccess(
    mockapi.post("/spreadModel", (req) => {
        req.expect.bodyEquals(spreadModelRequest);
        return {
            status: 204
          };
    }),
);

Scenarios.Spread_SpreadAlias = passOnSuccess(
    mockapi.post("/spreadAlias", (req) => {
        req.expect.bodyEquals(spreadAliasRequest);
        return {
            status: 204
          };
    }),
);

Scenarios.Spread_SpreadMultiTargetAlias = passOnSuccess(
    mockapi.post("/spreadMultiTargetAlias/1", (req) => {
        req.expect.bodyEquals(spreadMultiTargetAliasRequest);
        req.expect.containsHeader("top", "1");
        return {
            status: 204
          };
    }),
);

Scenarios.Spread_SpreadAliasWithModel = passOnSuccess(
    mockapi.post("/spreadAliasWithModel/1", (req) => {
        req.expect.bodyEquals(spreadAliasWithModelRequest);
        req.expect.containsHeader("top", "1");
        return {
            status: 204
          };
    }),
);

Scenarios.Spread_SpreadAliasWithSpreadAlias = passOnSuccess(
    mockapi.post("/spreadAliasWithSpreadAlias/1", (req) => {
        req.expect.bodyEquals(spreadAliasWithSpreadAliasRequest);
        req.expect.containsHeader("top", "1");
        return {
            status: 204
          };
    }),
);

Scenarios.Spread_SpreadAliasWithoutOptionalProps = passOnSuccess(
    mockapi.post("/spreadAliasWithOptionalProps/1", (req) => {
        req.expect.bodyEquals(spreadAliasWithoutOptionalPropRequest);
        req.expect.containsHeader("top", "1");
        return {
            status: 204
          };
    }),
);

Scenarios.Spread_SpreadAliasWithOptionalProps = passOnSuccess(
    mockapi.post("/spreadAliasWithOptionalProps/2", (req) => {
        req.expect.bodyEquals(spreadAliasWithOptionalPropRequest);
        req.expect.containsHeader("top", "1");
        return {
            status: 204
          };
    }),
);

Scenarios.Spread_SpreadAliasWithRequiredAndOptionalCollections = passOnSuccess(
    mockapi.post("/spreadAliasWithCollections", (req) => {
        req.expect.bodyEquals(spreadAliasWithRequiredAndOptionalCollections);
        return {
            status: 204
          };
    }),
);
