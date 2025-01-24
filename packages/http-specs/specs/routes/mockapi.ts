import { MockRequest, passOnSuccess, ScenarioMockApi, ValidationError } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createTests(uri: string) {
  const url = new URL("http://example.com" + uri);
  const queryMap = new Map<string, string | string[]>();
  for (const [key, value] of url.searchParams.entries()) {
    if (queryMap.has(key)) {
      const existing = queryMap.get(key)!;
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        queryMap.set(key, [existing, value]);
      }
    } else {
      queryMap.set(key, value);
    }
  }
  return passOnSuccess({
    uri: url.pathname,
    method: "get",
    request: {
      params: Object.fromEntries(queryMap),
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      for (const [key, value] of queryMap.entries()) {
        if (Array.isArray(value)) {
          req.expect.containsQueryParam(key, value, "multi");
        } else {
          req.expect.containsQueryParam(key, value);
        }
      }
      for (const param of Object.keys(req.query)) {
        if (!url.searchParams.has(param)) {
          throw new ValidationError(
            `Unexpected query parameter ${param}`,
            undefined,
            req.query[param],
          );
        }
      }
      return { status: 204 };
    },
    kind: "MockApiDefinition",
  });
}

Scenarios.Routes_InInterface = createTests("/routes/fixed");
Scenarios.Routes_fixed = createTests("/routes/in-interface/fixed");
Scenarios.Routes_PathParameters_templateOnly = createTests("/routes/path/template-only/a");
Scenarios.Routes_PathParameters_explicit = createTests("/routes/path/explicit/a");
Scenarios.Routes_PathParameters_annotationOnly = createTests("/routes/path/annotation-only/a");
Scenarios.Routes_PathParameters_ReservedExpansion_template = createTests(
  "/routes/path/reserved-expansion/template/foo/bar%20baz",
);
Scenarios.Routes_PathParameters_ReservedExpansion_annotation = createTests(
  "/routes/path/reserved-expansion/annotation/foo/bar%20baz",
);
Scenarios.Routes_PathParameters_SimpleExpansion_Standard_primitive = createTests(
  "/routes/path/simple/standard/primitivea",
);
Scenarios.Routes_PathParameters_SimpleExpansion_Standard_array = createTests(
  "/routes/path/simple/standard/arraya,b",
);
Scenarios.Routes_PathParameters_SimpleExpansion_Standard_record = createTests(
  "/routes/path/simple/standard/recorda,1,b,2",
);
Scenarios.Routes_PathParameters_SimpleExpansion_Explode_primitive = createTests(
  "/routes/path/simple/standard/primitivea",
);
Scenarios.Routes_PathParameters_SimpleExpansion_Explode_array = createTests(
  "/routes/path/simple/standard/arraya,b",
);
Scenarios.Routes_PathParameters_SimpleExpansion_Explode_record = createTests(
  "/routes/path/simple/standard/recorda=1,b=2",
);
Scenarios.Routes_PathParameters_PathExpansion_Standard_primitive = createTests(
  "/routes/path/path/standard/primitive/a",
);
Scenarios.Routes_PathParameters_PathExpansion_Standard_array = createTests(
  "/routes/path/path/standard/array/a,b",
);
Scenarios.Routes_PathParameters_PathExpansion_Standard_record = createTests(
  "/routes/path/path/standard/record/a,1,b,2",
);
Scenarios.Routes_PathParameters_PathExpansion_Explode_primitive = createTests(
  "/routes/path/path/standard/primitive/a",
);
Scenarios.Routes_PathParameters_PathExpansion_Explode_array = createTests(
  "/routes/path/path/standard/array/a/b",
);
Scenarios.Routes_PathParameters_PathExpansion_Explode_record = createTests(
  "/routes/path/path/standard/record/a=1/b=2",
);
Scenarios.Routes_PathParameters_LabelExpansion_Standard_primitive = createTests(
  "/routes/path/label/standard/primitive.a",
);
Scenarios.Routes_PathParameters_LabelExpansion_Standard_array = createTests(
  "/routes/path/label/standard/array.a,b",
);
Scenarios.Routes_PathParameters_LabelExpansion_Standard_record = createTests(
  "/routes/path/label/standard/record.a,1,b,2",
);
Scenarios.Routes_PathParameters_LabelExpansion_Explode_primitive = createTests(
  "/routes/path/label/standard/primitive.a",
);
Scenarios.Routes_PathParameters_LabelExpansion_Explode_array = createTests(
  "/routes/path/label/standard/array.a.b",
);
Scenarios.Routes_PathParameters_LabelExpansion_Explode_record = createTests(
  "/routes/path/label/standard/record.a=1.b=2",
);
Scenarios.Routes_PathParameters_MatrixExpansion_Standard_primitive = createTests(
  "/routes/path/matrix/standard/primitive;a",
);
Scenarios.Routes_PathParameters_MatrixExpansion_Standard_array = createTests(
  "/routes/path/matrix/standard/array;a,b",
);
Scenarios.Routes_PathParameters_MatrixExpansion_Standard_record = createTests(
  "/routes/path/matrix/standard/record;a,1,b,2",
);
Scenarios.Routes_PathParameters_MatrixExpansion_Explode_primitive = createTests(
  "/routes/path/matrix/standard/primitive;a",
);
Scenarios.Routes_PathParameters_MatrixExpansion_Explode_array = createTests(
  "/routes/path/matrix/standard/array;a;b",
);
Scenarios.Routes_PathParameters_MatrixExpansion_Explode_record = createTests(
  "/routes/path/matrix/standard/record;a=1;b=2",
);
Scenarios.Routes_QueryParameters_templateOnly = createTests("/routes/query/template-only?param=a");
Scenarios.Routes_QueryParameters_explicit = createTests("/routes/query/explicit?param=a");
Scenarios.Routes_QueryParameters_annotationOnly = createTests(
  "/routes/query/annotation-only?param=a",
);
Scenarios.Routes_QueryParameters_QueryExpansion_Standard_primitive = createTests(
  "/routes/query/query-expansion/standard/primitive?param=a",
);
Scenarios.Routes_QueryParameters_QueryExpansion_Standard_array = createTests(
  "/routes/query/query-expansion/standard/array?param=a,b",
);
Scenarios.Routes_QueryParameters_QueryExpansion_Standard_record = createTests(
  "/routes/query/query-expansion/standard/record?param=a,1,b,2",
);
Scenarios.Routes_QueryParameters_QueryExpansion_Explode_primitive = createTests(
  "/routes/query/query-expansion/explode/primitive?param=a",
);
Scenarios.Routes_QueryParameters_QueryExpansion_Explode_array = createTests(
  "/routes/query/query-expansion/explode/array?param=a&param=b",
);
Scenarios.Routes_QueryParameters_QueryExpansion_Explode_record = createTests(
  "/routes/query/query-expansion/explode/record?a=1&b=2",
);
Scenarios.Routes_QueryParameters_QueryContinuation_Standard_primitive = createTests(
  "/routes/query/query-continuation/standard/primitive?fixed=true&param=a",
);
Scenarios.Routes_QueryParameters_QueryContinuation_Standard_array = createTests(
  "/routes/query/query-continuation/standard/array?fixed=true&param=a,b",
);
Scenarios.Routes_QueryParameters_QueryContinuation_Standard_record = createTests(
  "/routes/query/query-continuation/standard/record?fixed=true&param=a,1,b,2",
);
Scenarios.Routes_QueryParameters_QueryContinuation_Explode_primitive = createTests(
  "/routes/query/query-continuation/explode/primitive?fixed=true&param=a",
);
Scenarios.Routes_QueryParameters_QueryContinuation_Explode_array = createTests(
  "/routes/query/query-continuation/explode/array?fixed=true&param=a&param=b",
);
Scenarios.Routes_QueryParameters_QueryContinuation_Explode_record = createTests(
  "/routes/query/query-continuation/explode/record?fixed=true&a=1&b=2",
);
