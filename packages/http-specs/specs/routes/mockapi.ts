import { MockRequest, passOnSuccess, ScenarioMockApi, ValidationError } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createTests(uri: string, serverUri?: string, params?: Record<string, any>) {
  return passOnSuccess({
    uri: uri,
    method: "get",
    request: {
      params: params,
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      const url = new URL("http://example.com" + serverUri);
      for (const [key, value] of url.searchParams.entries()) {
        req.expect.containsQueryParam(key, value);
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
  "/routes/simple/standard/primitivea",
);
Scenarios.Routes_PathParameters_SimpleExpansion_Standard_array = createTests(
  "/routes/simple/standard/arraya,b",
);
Scenarios.Routes_PathParameters_SimpleExpansion_Standard_record = createTests(
  "/routes/simple/standard/recorda,1,b,2",
);
Scenarios.Routes_PathParameters_SimpleExpansion_Explode_primitive = createTests(
  "/routes/simple/standard/primitivea",
);
Scenarios.Routes_PathParameters_SimpleExpansion_Explode_array = createTests(
  "/routes/simple/standard/arraya,b",
);
Scenarios.Routes_PathParameters_SimpleExpansion_Explode_record = createTests(
  "/routes/simple/standard/recorda=1,b=2",
);

Scenarios.Routes_PathParameters_PathExpansion_Standard_primitive = createTests(
  "/routes/path/standard/primitive/a",
);
Scenarios.Routes_PathParameters_PathExpansion_Standard_array = createTests(
  "/routes/path/standard/array/a,b",
);
Scenarios.Routes_PathParameters_PathExpansion_Standard_record = createTests(
  "/routes/path/standard/record/a,1,b,2",
);
Scenarios.Routes_PathParameters_PathExpansion_Explode_primitive = createTests(
  "/routes/path/standard/primitive/a",
);
Scenarios.Routes_PathParameters_PathExpansion_Explode_array = createTests(
  "/routes/path/standard/array/a/b",
);
Scenarios.Routes_PathParameters_PathExpansion_Explode_record = createTests(
  "/routes/path/standard/record/a=1/b=2",
);

Scenarios.Routes_PathParameters_LabelExpansion_Standard_primitive = createTests(
  "/routes/label/standard/primitive.a",
);
Scenarios.Routes_PathParameters_LabelExpansion_Standard_array = createTests(
  "/routes/label/standard/array.a,b",
);
Scenarios.Routes_PathParameters_LabelExpansion_Standard_record = createTests(
  "/routes/label/standard/record.a,1,b,2",
);
Scenarios.Routes_PathParameters_LabelExpansion_Explode_primitive = createTests(
  "/routes/label/standard/primitive.a",
);
Scenarios.Routes_PathParameters_LabelExpansion_Explode_array = createTests(
  "/routes/label/standard/array.a.b",
);
Scenarios.Routes_PathParameters_LabelExpansion_Explode_record = createTests(
  "/routes/label/standard/record.a=1.b=2",
);

Scenarios.Routes_PathParameters_MatrixExpansion_Standard_primitive = createTests(
  "/routes/matrix/standard/primitive;a",
);
Scenarios.Routes_PathParameters_MatrixExpansion_Standard_array = createTests(
  "/routes/matrix/standard/array;a,b",
);
Scenarios.Routes_PathParameters_MatrixExpansion_Standard_record = createTests(
  "/routes/matrix/standard/record;a,1,b,2",
);
Scenarios.Routes_PathParameters_MatrixExpansion_Explode_primitive = createTests(
  "/routes/matrix/standard/primitive;a",
);
Scenarios.Routes_PathParameters_MatrixExpansion_Explode_array = createTests(
  "/routes/matrix/standard/array;a;b",
);
Scenarios.Routes_PathParameters_MatrixExpansion_Explode_record = createTests(
  "/routes/matrix/standard/record;a=1;b=2",
);

Scenarios.Routes_QueryParameters_templateOnly = createTests(
  "/routes/query/template-only",
  "/routes/query/template-only?param=a",
  {
    param: "a",
  },
);
Scenarios.Routes_QueryParameters_explicit = createTests(
  "/routes/query/explicit",
  "/routes/query/explicit?param=a",
  {
    param: "a",
  },
);
Scenarios.Routes_QueryParameters_annotationOnly = createTests(
  "/routes/query/annotation-only",
  "/routes/query/annotation-only?param=a",
  {
    param: "a",
  },
);

Scenarios.Routes_QueryParameters_QueryExpansion_Standard_primitive = createTests(
  "/routes/query/query-expansion/standard/primitive",
  "/routes/query/query-expansion/standard/primitive?param=a",
  {
    param: "a",
  },
);
Scenarios.Routes_QueryParameters_QueryExpansion_Standard_array = createTests(
  "/routes/query/query-expansion/standard/array",
  "/routes/query/query-expansion/standard/array?param=a,b",
  {
    param: "a,b",
  },
);
Scenarios.Routes_QueryParameters_QueryExpansion_Standard_record = createTests(
  "/routes/query/query-expansion/standard/record",
  "/routes/query/query-expansion/standard/record?param=a,1,b,2",
  {
    param: "a,1,b,2",
  },
);
Scenarios.Routes_QueryParameters_QueryExpansion_Explode_primitive = createTests(
  "/routes/query/query-expansion/explode/primitive",
  "/routes/query/query-expansion/explode/primitive?param=a",
  {
    param: "a",
  },
);
Scenarios.Routes_QueryParameters_QueryExpansion_Explode_array = createTests(
  "/routes/query/query-expansion/explode/array",
  "/routes/query/query-expansion/explode/array?param=a,b",
  {
    param: "a,b",
  },
);
Scenarios.Routes_QueryParameters_QueryExpansion_Explode_record = createTests(
  "/routes/query/query-expansion/explode/record",
  "/routes/query/query-expansion/explode/record?a=1&b=2",
  {
    a: "1",
    b: "2",
  },
);

Scenarios.Routes_QueryParameters_QueryContinuation_Standard_primitive = createTests(
  "/routes/query/query-continuation/standard/primitive",
  "/routes/query/query-continuation/standard/primitive?fixed=true&param=a",
  {
    fixed: true,
    param: "a",
  },
);
Scenarios.Routes_QueryParameters_QueryContinuation_Standard_array = createTests(
  "/routes/query/query-continuation/standard/array",
  "/routes/query/query-continuation/standard/array?fixed=true&param=a,b",
  {
    fixed: true,
    param: "a,b",
  },
);
Scenarios.Routes_QueryParameters_QueryContinuation_Standard_record = createTests(
  "/routes/query/query-continuation/standard/record",
  "/routes/query/query-continuation/standard/record?fixed=true&param=a,1,b,2",
  {
    fixed: true,
    param: "a,1,b,2",
  },
);
Scenarios.Routes_QueryParameters_QueryContinuation_Explode_primitive = createTests(
  "/routes/query/query-continuation/explode/primitive",
  "/routes/query/query-continuation/explode/primitive?fixed=true&param=a",
  {
    fixed: true,
    param: "a",
  },
);
Scenarios.Routes_QueryParameters_QueryContinuation_Explode_array = createTests(
  "/routes/query/query-continuation/explode/array",
  "/routes/query/query-continuation/explode/array?fixed=true&param=a,b",
  {
    fixed: true,
    param: "a,b",
  },
);
Scenarios.Routes_QueryParameters_QueryContinuation_Explode_record = createTests(
  "/routes/query/query-continuation/explode/record",
  "/routes/query/query-continuation/explode/record?fixed=true&a=1&b=2",
  {
    fixed: true,
    a: "1",
    b: "2",
  },
);
