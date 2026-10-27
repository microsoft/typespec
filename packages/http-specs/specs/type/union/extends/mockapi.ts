import type { ScenarioMockApi } from "@typespec/spec-api";
import { json, passOnSuccess } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const cases = [
  { name: "DerivedScalar_Literal", route: "derived-scalar/literal", body: "all" },
  { name: "DerivedScalar_Custom", route: "derived-scalar/custom", body: "collection-123" },
];

for (const test of cases) {
  const name = `Type_Union_Extends_${test.name}`;
  const uri = `/type/union/extends/${test.route}`;
  Scenarios[`${name}_get`] = passOnSuccess({
    uri,
    method: "get",
    request: {},
    response: { status: 200, body: json(test.body) },
    kind: "MockApiDefinition",
  });
  Scenarios[`${name}_put`] = passOnSuccess({
    uri,
    method: "put",
    request: { body: json(test.body) },
    response: { status: 204 },
    kind: "MockApiDefinition",
  });
}
