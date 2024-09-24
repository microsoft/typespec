import {
  Diagnostic,
  DiagnosticTarget,
  ModelProperty,
  Program,
  Scalar,
  Type,
  createDiagnosticCollector,
  getMaxValue,
  getMinValue,
  ignoreDiagnostics,
} from "@typespec/compiler";
import { createDiagnostic } from "./lib.js";
import { HttpStatusCodeRange, HttpStatusCodes } from "./types.js";

function error(target: DiagnosticTarget): [HttpStatusCodes, readonly Diagnostic[]] {
  return [
    [],
    [
      createDiagnostic({
        code: "status-code-invalid",
        target,
        messageId: "value",
      }),
    ],
  ];
}

// Issue a diagnostic if not valid
export function validateStatusCode(
  code: number | string,
  diagnosticTarget: DiagnosticTarget,
): [HttpStatusCodes, readonly Diagnostic[]] {
  const codeAsNumber = typeof code === "string" ? parseInt(code, 10) : code;

  if (isNaN(codeAsNumber)) {
    return error(diagnosticTarget);
  }
  if (!Number.isInteger(codeAsNumber)) {
    return error(diagnosticTarget);
  }
  if (codeAsNumber < 100 || codeAsNumber > 599) {
    return error(diagnosticTarget);
  }
  return [[codeAsNumber], []];
}

export function getStatusCodesFromType(
  program: Program,
  type: Type,
  diagnosticTarget: DiagnosticTarget,
): [HttpStatusCodes, readonly Diagnostic[]] {
  switch (type.kind) {
    case "String":
    case "Number":
      return validateStatusCode(type.value, diagnosticTarget);
    case "Union":
      const diagnostics = createDiagnosticCollector();
      const statusCodes = [...type.variants.values()].flatMap((variant) => {
        return diagnostics.pipe(getStatusCodesFromType(program, variant.type, diagnosticTarget));
      });
      return diagnostics.wrap(statusCodes);
    case "Scalar":
      return validateStatusCodeRange(program, type, type, diagnosticTarget);
    case "ModelProperty":
      if (type.type.kind === "Scalar") {
        return validateStatusCodeRange(program, type, type.type, diagnosticTarget);
      } else {
        return getStatusCodesFromType(program, type.type, diagnosticTarget);
      }
    default:
      return error(diagnosticTarget);
  }
}

function validateStatusCodeRange(
  program: Program,
  type: Scalar | ModelProperty,
  scalar: Scalar,
  diagnosticTarget: DiagnosticTarget,
): [HttpStatusCodes, readonly Diagnostic[]] {
  if (!isInt32(program, scalar)) {
    return error(diagnosticTarget);
  }
  const range = getStatusCodesRange(program, type, diagnosticTarget);
  if (isRangeComplete(range)) {
    return [[range], []];
  } else {
    return error(diagnosticTarget); // TODO better error explaining missing start/end
  }
}

function isRangeComplete(range: Partial<HttpStatusCodeRange>): range is HttpStatusCodeRange {
  return range.start !== undefined && range.end !== undefined;
}

function getStatusCodesRange(
  program: Program,
  type: Scalar | ModelProperty,
  diagnosticTarget: DiagnosticTarget,
): Partial<HttpStatusCodeRange> {
  const start = getMinValue(program, type);
  const end = getMaxValue(program, type);

  let baseRange = {};
  if (
    type.kind === "ModelProperty" &&
    (type.type.kind === "Scalar" || type.type.kind === "ModelProperty")
  ) {
    baseRange = getStatusCodesRange(program, type.type, diagnosticTarget);
  } else if (type.kind === "Scalar" && type.baseScalar) {
    baseRange = getStatusCodesRange(program, type.baseScalar, diagnosticTarget);
  }

  return { ...baseRange, start, end };
}

function isInt32(program: Program, type: Type) {
  return ignoreDiagnostics(
    program.checker.isTypeAssignableTo(
      type.projectionBase ?? type,
      program.checker.getStdType("int32"),
      type,
    ),
  );
}
