import { Diagnostic, DiagnosticTarget, Program, Type } from "@typespec/compiler";
import { HttpStatusCodeRange, HttpStatusCodesEntry } from "@typespec/http";
import { isDefaultResponse } from "@typespec/openapi";
import { createDiagnostic } from "./lib.js";
import { OpenAPI3StatusCode } from "./types.js";

export function getOpenAPI3StatusCodes(
  program: Program,
  statusCodes: HttpStatusCodesEntry,
  response: Type
): [OpenAPI3StatusCode[], readonly Diagnostic[]] {
  if (isDefaultResponse(program, response) || statusCodes === "*") {
    return [["default"], []];
  } else if (typeof statusCodes === "number") {
    return [[String(statusCodes)], []];
  } else {
    return rangeToOpenAPI(statusCodes, response);
  }
}

function rangeToOpenAPI(
  range: HttpStatusCodeRange,
  diagnosticTarget: DiagnosticTarget
): [OpenAPI3StatusCode[], readonly Diagnostic[]] {
  const diagnostics: Diagnostic[] = [];
  const reportInvalid = () =>
    diagnostics.push(
      createDiagnostic({
        code: "unsupported-status-code-range",
        format: { start: String(range.start), end: String(range.end) },
        target: diagnosticTarget,
      })
    );

  const codes: OpenAPI3StatusCode[] = [];
  let start = range.start;
  let end = range.end;

  if (range.start < 100) {
    reportInvalid();
    start = 100;
    codes.push("default");
  } else if (range.end > 599) {
    reportInvalid();
    codes.push("default");
    end = 599;
  }
  const groups = [1, 2, 3, 4, 5];

  for (const group of groups) {
    if (start > end) {
      break;
    }
    const groupStart = group * 100;
    const groupEnd = groupStart + 99;
    if (start >= groupStart && start <= groupEnd) {
      codes.push(`${group}XX`);
      if (start !== groupStart || end < groupEnd) {
        reportInvalid();
      }

      start = groupStart + 100;
    }
  }

  return [codes, diagnostics];
}
