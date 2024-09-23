import { passOnSuccess, mockapi, ValidationError } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function defineUri(uri: string) {
  const url = new URL("http://example.com" + uri);
  return passOnSuccess(
    mockapi.get(url.pathname, (req) => {
      for (const [key, value] of url.searchParams.entries()) {
        req.expect.containsQueryParam(key, value);
      }
      for (const param of Object.keys(req.query)) {
        if (!url.searchParams.has(param)) {
          throw new ValidationError(`Unexpected query parameter ${param}`, undefined, req.query[param]);
        }
      }
      return { status: 204 };
    }),
  );
}

Scenarios.Routes_InInterface = defineUri("/routes/fixed");
Scenarios.Routes_fixed = defineUri("/routes/in-interface/fixed");

Scenarios.Routes_PathParameters_templateOnly = defineUri("/routes/path/template-only/a");
Scenarios.Routes_PathParameters_explicit = defineUri("/routes/path/explicit/a");
Scenarios.Routes_PathParameters_annotationOnly = defineUri("/routes/path/annotation-only/a");

Scenarios.Routes_PathParameters_ReservedExpansion_template = defineUri(
  "/routes/path/reserved-expansion/template/foo/bar%20baz",
);
Scenarios.Routes_PathParameters_ReservedExpansion_annotation = defineUri(
  "/routes/path/reserved-expansion/annotation/foo/bar%20baz",
);

Scenarios.Routes_PathParameters_SimpleExpansion_Standard_primitive = defineUri("/routes/simple/standard/primitivea");
Scenarios.Routes_PathParameters_SimpleExpansion_Standard_array = defineUri("/routes/simple/standard/arraya,b");
Scenarios.Routes_PathParameters_SimpleExpansion_Standard_record = defineUri("/routes/simple/standard/recorda,1,b,2");
Scenarios.Routes_PathParameters_SimpleExpansion_Explode_primitive = defineUri("/routes/simple/standard/primitivea");
Scenarios.Routes_PathParameters_SimpleExpansion_Explode_array = defineUri("/routes/simple/standard/arraya,b");
Scenarios.Routes_PathParameters_SimpleExpansion_Explode_record = defineUri("/routes/simple/standard/recorda=1,b=2");

Scenarios.Routes_PathParameters_PathExpansion_Standard_primitive = defineUri("/routes/path/standard/primitive/a");
Scenarios.Routes_PathParameters_PathExpansion_Standard_array = defineUri("/routes/path/standard/array/a,b");
Scenarios.Routes_PathParameters_PathExpansion_Standard_record = defineUri("/routes/path/standard/record/a,1,b,2");
Scenarios.Routes_PathParameters_PathExpansion_Explode_primitive = defineUri("/routes/path/standard/primitive/a");
Scenarios.Routes_PathParameters_PathExpansion_Explode_array = defineUri("/routes/path/standard/array/a/b");
Scenarios.Routes_PathParameters_PathExpansion_Explode_record = defineUri("/routes/path/standard/record/a=1/b=2");

Scenarios.Routes_PathParameters_LabelExpansion_Standard_primitive = defineUri("/routes/label/standard/primitive.a");
Scenarios.Routes_PathParameters_LabelExpansion_Standard_array = defineUri("/routes/label/standard/array.a,b");
Scenarios.Routes_PathParameters_LabelExpansion_Standard_record = defineUri("/routes/label/standard/record.a,1,b,2");
Scenarios.Routes_PathParameters_LabelExpansion_Explode_primitive = defineUri("/routes/label/standard/primitive.a");
Scenarios.Routes_PathParameters_LabelExpansion_Explode_array = defineUri("/routes/label/standard/array.a.b");
Scenarios.Routes_PathParameters_LabelExpansion_Explode_record = defineUri("/routes/label/standard/record.a=1.b=2");

Scenarios.Routes_PathParameters_MatrixExpansion_Standard_primitive = defineUri("/routes/matrix/standard/primitive;a");
Scenarios.Routes_PathParameters_MatrixExpansion_Standard_array = defineUri("/routes/matrix/standard/array;a,b");
Scenarios.Routes_PathParameters_MatrixExpansion_Standard_record = defineUri("/routes/matrix/standard/record;a,1,b,2");
Scenarios.Routes_PathParameters_MatrixExpansion_Explode_primitive = defineUri("/routes/matrix/standard/primitive;a");
Scenarios.Routes_PathParameters_MatrixExpansion_Explode_array = defineUri("/routes/matrix/standard/array;a;b");
Scenarios.Routes_PathParameters_MatrixExpansion_Explode_record = defineUri("/routes/matrix/standard/record;a=1;b=2");

Scenarios.Routes_QueryParameters_templateOnly = defineUri("/routes/query/template-only?param=a");
Scenarios.Routes_QueryParameters_explicit = defineUri("/routes/query/explicit?param=a");
Scenarios.Routes_QueryParameters_annotationOnly = defineUri("/routes/query/annotation-only?param=a");

Scenarios.Routes_QueryParameters_QueryExpansion_Standard_primitive = defineUri(
  "/routes/query/query-expansion/standard/primitive?param=a",
);
Scenarios.Routes_QueryParameters_QueryExpansion_Standard_array = defineUri(
  "/routes/query/query-expansion/standard/array?param=a,b",
);
Scenarios.Routes_QueryParameters_QueryExpansion_Standard_record = defineUri(
  "/routes/query/query-expansion/standard/record?param=a,1,b,2",
);
Scenarios.Routes_QueryParameters_QueryExpansion_Explode_primitive = defineUri(
  "/routes/query/query-expansion/explode/primitive?param=a",
);
Scenarios.Routes_QueryParameters_QueryExpansion_Explode_array = defineUri(
  "/routes/query/query-expansion/explode/array?param=a&param=b",
);
Scenarios.Routes_QueryParameters_QueryExpansion_Explode_record = defineUri(
  "/routes/query/query-expansion/explode/record?a=1&b=2",
);

Scenarios.Routes_QueryParameters_QueryContinuation_Standard_primitive = defineUri(
  "/routes/query/query-continuation/standard/primitive?fixed=true&param=a",
);
Scenarios.Routes_QueryParameters_QueryContinuation_Standard_array = defineUri(
  "/routes/query/query-continuation/standard/array?fixed=true&param=a,b",
);
Scenarios.Routes_QueryParameters_QueryContinuation_Standard_record = defineUri(
  "/routes/query/query-continuation/standard/record?fixed=true&param=a,1,b,2",
);
Scenarios.Routes_QueryParameters_QueryContinuation_Explode_primitive = defineUri(
  "/routes/query/query-continuation/explode/primitive?fixed=true&param=a",
);
Scenarios.Routes_QueryParameters_QueryContinuation_Explode_array = defineUri(
  "/routes/query/query-continuation/explode/array?fixed=true&param=a&param=b",
);
Scenarios.Routes_QueryParameters_QueryContinuation_Explode_record = defineUri(
  "/routes/query/query-continuation/explode/record?fixed=true&a=1&b=2",
);
