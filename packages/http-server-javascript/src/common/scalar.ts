// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { DiagnosticTarget, NoTarget, Program, Scalar, formatDiagnostic } from "@typespec/compiler";
import { JsContext } from "../ctx.js";
import { reportDiagnostic } from "../lib.js";
import { parseCase } from "../util/case.js";
import { UnimplementedError } from "../util/error.js";
import { getFullyQualifiedTypeName } from "../util/name.js";

/**
 * Emits a declaration for a scalar type.
 *
 * This is rare in TypeScript, as the scalar will ordinarily be used inline, but may be desirable in some cases.
 *
 * @param ctx - The emitter context.
 * @param scalar - The scalar to emit.
 * @returns a string that declares an alias to the scalar type in TypeScript.
 */
export function emitScalar(ctx: JsContext, scalar: Scalar): string {
  const jsScalar = getJsScalar(ctx.program, scalar, scalar.node.id);

  const name = parseCase(scalar.name).pascalCase;

  return `type ${name} = ${jsScalar};`;
}

/**
 * Get the string parsing template for a given scalar.
 *
 * It is common that a scalar type is encoded as a string. For example, in HTTP path parameters or query parameters
 * where the value may be an integer, but the APIs expose it as a string. In such cases the parse template may be
 * used to coerce the string value to the correct scalar type.
 *
 * The result of this function contains the string "{}" exactly once, which should be replaced with the text of an
 * expression evaluating to the string representation of the scalar.
 *
 * For example, scalars that are represented by JS `number` are parsed with the template `Number({})`, which will
 * convert the string to a number.
 *
 * @param ctx - The emitter context.
 * @param scalar - The scalar to parse from a string
 * @returns a template expression string that can be used to parse a string into the scalar type.
 */
export function parseTemplateForScalar(ctx: JsContext, scalar: Scalar): string {
  const jsScalar = getJsScalar(ctx.program, scalar, scalar);

  switch (jsScalar) {
    case "string":
      return "{}";
    case "number":
      return "Number({})";
    case "bigint":
      return "BigInt({})";
    default:
      throw new UnimplementedError(`parse template for scalar '${jsScalar}'`);
  }
}

const __JS_SCALARS_MAP = new Map<Program, Map<Scalar, string>>();

function getScalarsMap(program: Program): Map<Scalar, string> {
  let scalars = __JS_SCALARS_MAP.get(program);

  if (scalars === undefined) {
    scalars = createScalarsMap(program);
    __JS_SCALARS_MAP.set(program, scalars);
  }

  return scalars;
}

function createScalarsMap(program: Program): Map<Scalar, string> {
  const entries = [
    [program.resolveTypeReference("TypeSpec.bytes"), "Uint8Array"],
    [program.resolveTypeReference("TypeSpec.boolean"), "boolean"],
    [program.resolveTypeReference("TypeSpec.string"), "string"],
    [program.resolveTypeReference("TypeSpec.float32"), "number"],
    [program.resolveTypeReference("TypeSpec.float64"), "number"],

    [program.resolveTypeReference("TypeSpec.uint32"), "number"],
    [program.resolveTypeReference("TypeSpec.uint16"), "number"],
    [program.resolveTypeReference("TypeSpec.uint8"), "number"],
    [program.resolveTypeReference("TypeSpec.int32"), "number"],
    [program.resolveTypeReference("TypeSpec.int16"), "number"],
    [program.resolveTypeReference("TypeSpec.int8"), "number"],

    [program.resolveTypeReference("TypeSpec.safeint"), "number"],
    [program.resolveTypeReference("TypeSpec.integer"), "bigint"],
    [program.resolveTypeReference("TypeSpec.plainDate"), "Date"],
    [program.resolveTypeReference("TypeSpec.plainTime"), "Date"],
    [program.resolveTypeReference("TypeSpec.utcDateTime"), "Date"],
  ] as const;

  for (const [[type, diagnostics]] of entries) {
    if (!type) {
      const diagnosticString = diagnostics.map(formatDiagnostic).join("\n");
      throw new Error(`failed to construct TypeSpec -> JavaScript scalar map: ${diagnosticString}`);
    } else if (type.kind !== "Scalar") {
      throw new Error(
        `type ${(type as any).name ?? "<anonymous>"} is a '${type.kind}', expected 'scalar'`,
      );
    }
  }

  return new Map<Scalar, string>(entries.map(([[type], scalar]) => [type! as Scalar, scalar]));
}

/**
 * Gets a TypeScript type that can represent a given TypeSpec scalar.
 *
 * Scalar recognition is recursive. If a scalar is not recognized, we will treat it as its parent scalar and try again.
 *
 * If no scalar in the chain is recognized, it will be treated as `unknown` and a warning will be issued.
 *
 * @param program - The program that contains the scalar
 * @param scalar - The scalar to get the TypeScript type for
 * @param diagnosticTarget - Where to report a diagnostic if the scalar is not recognized.
 * @returns a string containing a TypeScript type that can represent the scalar
 */
export function getJsScalar(
  program: Program,
  scalar: Scalar,
  diagnosticTarget: DiagnosticTarget | typeof NoTarget,
): string {
  const scalars = getScalarsMap(program);

  let _scalar: Scalar | undefined = scalar;

  while (_scalar !== undefined) {
    const jsScalar = scalars.get(_scalar);

    if (jsScalar !== undefined) {
      return jsScalar;
    }

    _scalar = _scalar.baseScalar;
  }

  reportDiagnostic(program, {
    code: "unrecognized-scalar",
    target: diagnosticTarget,
    format: {
      scalar: getFullyQualifiedTypeName(scalar),
    },
  });

  return "unknown";
}
