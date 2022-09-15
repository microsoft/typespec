import {
  createDiagnosticCollector,
  Diagnostic,
  filterModelProperties,
  ModelProperty,
  Operation,
  Program,
} from "@cadl-lang/compiler";
import { createDiagnostic, reportDiagnostic } from "../lib.js";
import { getHeaderFieldName, getPathParamName, getQueryParamName, isBody } from "./decorators.js";
import { HttpOperationParameters } from "./types.js";

export function getOperationParameters(
  program: Program,
  operation: Operation
): [HttpOperationParameters, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const result: HttpOperationParameters = {
    parameters: [],
  };
  const unannotatedParams = new Set<ModelProperty>();

  for (const param of operation.parameters.properties.values()) {
    const queryParam = getQueryParamName(program, param);
    const pathParam = getPathParamName(program, param);
    const headerParam = getHeaderFieldName(program, param);
    const bodyParam = isBody(program, param);

    const defined = [
      ["query", queryParam],
      ["path", pathParam],
      ["header", headerParam],
      ["body", bodyParam],
    ].filter((x) => !!x[1]);
    if (defined.length >= 2) {
      diagnostics.add(
        createDiagnostic({
          code: "operation-param-duplicate-type",
          format: { paramName: param.name, types: defined.map((x) => x[0]).join(", ") },
          target: param,
        })
      );
    }

    if (queryParam) {
      result.parameters.push({ type: "query", name: queryParam, param });
    } else if (pathParam) {
      if (param.optional && param.default === undefined) {
        reportDiagnostic(program, {
          code: "optional-path-param",
          format: { paramName: param.name },
          target: operation,
        });
      }
      result.parameters.push({ type: "path", name: pathParam, param });
    } else if (headerParam) {
      result.parameters.push({ type: "header", name: headerParam, param });
    } else if (bodyParam) {
      if (result.bodyType === undefined) {
        result.bodyParameter = param;
        result.bodyType = param.type;
      } else {
        diagnostics.add(createDiagnostic({ code: "duplicate-body", target: param }));
      }
    } else {
      unannotatedParams.add(param);
    }
  }

  if (unannotatedParams.size > 0) {
    if (result.bodyType === undefined) {
      result.bodyType = filterModelProperties(program, operation.parameters, (p) =>
        unannotatedParams.has(p)
      );
    } else {
      diagnostics.add(
        createDiagnostic({
          code: "duplicate-body",
          messageId: "bodyAndUnannotated",
          target: operation,
        })
      );
    }
  }
  return diagnostics.wrap(result);
}
