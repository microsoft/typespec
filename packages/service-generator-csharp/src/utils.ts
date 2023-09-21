import { IntrinsicScalarName, Model, NoTarget, Program, Scalar, Type } from "@typespec/compiler";
import { StringBuilder } from "@typespec/compiler/emitter-framework";
import { HttpOperation, StatusCode, isMetadata } from "@typespec/http";
import { camelCase, pascalCase } from "change-case";
import { CSharpType, NameCasingType } from "./interfaces.js";
import { reportDiagnostic } from "./lib.js";

export function getCSharpTypeForScalar(program: Program, scalar: Scalar): CSharpType {
  if (program.checker.isStdType(scalar)) {
    return getCSharpTypeForStdScalars(program, scalar);
  }
  if (scalar.baseScalar) {
    return getCSharpTypeForScalar(program, scalar.baseScalar);
  }

  reportDiagnostic(program, {
    code: "unrecognized-scalar",
    format: { typeName: scalar.name },
    target: scalar,
  });
  return new CSharpType({
    name: "Object",
    namespace: "System",
    isBuiltIn: true,
    isValueType: false,
  });
}

export function getCSharpTypeForStdScalars(
  program: Program,
  scalar: Scalar & { name: IntrinsicScalarName }
): CSharpType {
  const standardScalars: Map<IntrinsicScalarName, CSharpType> = new Map<
    IntrinsicScalarName,
    CSharpType
  >([
    [
      "bytes",
      new CSharpType({ name: "byte[]", namespace: "System", isBuiltIn: true, isValueType: false }),
    ],
    [
      "int8",
      new CSharpType({ name: "SByte", namespace: "System", isBuiltIn: true, isValueType: true }),
    ],
    [
      "uint8",
      new CSharpType({ name: "Byte", namespace: "System", isBuiltIn: true, isValueType: true }),
    ],
    [
      "int16",
      new CSharpType({ name: "Int16", namespace: "System", isBuiltIn: true, isValueType: true }),
    ],
    [
      "uint16",
      new CSharpType({ name: "UInt16", namespace: "System", isBuiltIn: true, isValueType: true }),
    ],
    [
      "int16",
      new CSharpType({ name: "Int16", namespace: "System", isBuiltIn: true, isValueType: true }),
    ],
    [
      "uint16",
      new CSharpType({ name: "UInt16", namespace: "System", isBuiltIn: true, isValueType: true }),
    ],
    [
      "int32",
      new CSharpType({ name: "int", namespace: "System", isBuiltIn: true, isValueType: true }),
    ],
    [
      "uint32",
      new CSharpType({ name: "UInt32", namespace: "System", isBuiltIn: true, isValueType: true }),
    ],
    [
      "integer",
      new CSharpType({ name: "long", namespace: "System", isBuiltIn: true, isValueType: true }),
    ],
    [
      "int64",
      new CSharpType({ name: "long", namespace: "System", isBuiltIn: true, isValueType: true }),
    ],
    [
      "uint64",
      new CSharpType({ name: "UInt64", namespace: "System", isBuiltIn: true, isValueType: true }),
    ],
    [
      "safeint",
      new CSharpType({ name: "long", namespace: "System", isBuiltIn: true, isValueType: true }),
    ],
    [
      "float",
      new CSharpType({ name: "double", namespace: "System", isBuiltIn: true, isValueType: true }),
    ],
    [
      "float64",
      new CSharpType({ name: "double", namespace: "System", isBuiltIn: true, isValueType: true }),
    ],
    [
      "float32",
      new CSharpType({ name: "float", namespace: "System", isBuiltIn: true, isValueType: true }),
    ],
    [
      "string",
      new CSharpType({ name: "string", namespace: "System", isBuiltIn: true, isValueType: false }),
    ],
    [
      "boolean",
      new CSharpType({ name: "bool", namespace: "System", isBuiltIn: true, isValueType: true }),
    ],
    [
      "plainDate",
      new CSharpType({ name: "DateTime", namespace: "System", isBuiltIn: true, isValueType: true }),
    ],
    [
      "utcDateTime",
      new CSharpType({
        name: "DateTimeOffset",
        namespace: "System",
        isBuiltIn: true,
        isValueType: true,
      }),
    ],
    [
      "offsetDateTime",
      new CSharpType({
        name: "DateTimeOffset",
        namespace: "System",
        isBuiltIn: true,
        isValueType: true,
      }),
    ],
    [
      "plainTime",
      new CSharpType({ name: "DateTime", namespace: "System", isBuiltIn: true, isValueType: true }),
    ],
    [
      "duration",
      new CSharpType({ name: "TimeSpan", namespace: "System", isBuiltIn: true, isValueType: true }),
    ],
    [
      "numeric",
      new CSharpType({ name: "object", namespace: "System", isBuiltIn: true, isValueType: false }),
    ],
    [
      "url",
      new CSharpType({ name: "string", namespace: "System", isBuiltIn: true, isValueType: false }),
    ],
    [
      "decimal",
      new CSharpType({ name: "decimal", namespace: "System", isBuiltIn: true, isValueType: true }),
    ],
    [
      "decimal128",
      new CSharpType({ name: "decimal", namespace: "System", isBuiltIn: true, isValueType: true }),
    ],
  ]);
  const builtIn: CSharpType | undefined = standardScalars.get(scalar.name);
  if (builtIn !== undefined) {
    if (scalar.name === "numeric" || scalar.name === "integer" || scalar.name === "float") {
      reportDiagnostic(program, {
        code: "no-numeric",
        format: { sourceType: scalar.name, targetType: builtIn?.getTypeReference() },
        target: scalar,
      });
    }
    return builtIn;
  }

  reportDiagnostic(program, {
    code: "unrecognized-scalar",
    format: { typeName: scalar.name },
    target: scalar,
  });
  return new CSharpType({
    name: "Object",
    namespace: "System",
    isBuiltIn: true,
    isValueType: false,
  });
}

export function isValueType(program: Program, type: Type): boolean {
  if (type.kind === "Boolean" || type.kind === "Number" || type.kind === "Enum") return true;
  if (type.kind !== "Scalar") return false;
  const scalarType = getCSharpTypeForScalar(program, type);
  return scalarType.isValueType;
}

export function formatComment(
  text: string,
  lineLength: number = 76,
  lineEnd: string = "\n"
): string {
  function getNextLine(target: string): string {
    for (let i = lineLength - 1; i > 0; i--) {
      if ([" ", ".", "?", "-", ",", ";"].includes(target.charAt(i))) {
        return `/// ${text.substring(0, i)}`;
      }
    }

    return `/// ${text.substring(0, lineLength)}`;
  }
  let remaining: string = text;
  const lines: string[] = [];
  while (remaining.length > lineLength) {
    const currentLine = getNextLine(remaining);
    remaining =
      remaining.length > currentLine.length ? remaining.substring(currentLine.length + 1) : "";
    lines.push(currentLine);
  }

  if (remaining.length > 0) lines.push(`/// ${remaining}`);
  return `///<summary>${lineEnd}${lines.join(lineEnd)}${lineEnd}///</summary>`;
}

export function getCSharpIdentifier(
  name: string,
  context: NameCasingType = NameCasingType.Class
): string {
  if (name === undefined) return "Placeholder";
  switch (context) {
    case NameCasingType.Namespace:
      const parts: string[] = [];
      for (const part of name.split(".")) {
        parts.push(getCSharpIdentifier(part, NameCasingType.Class));
      }
      return parts.join(".");
    case NameCasingType.Parameter:
    case NameCasingType.Variable:
      return `${camelCase(name)}`;
    default:
      return `${pascalCase(name)}`;
  }
}

export function ensureCSharpIdentifier(
  program: Program,
  target: Type,
  name: string,
  context: NameCasingType = NameCasingType.Class
): string {
  let location = "";
  switch (target.kind) {
    case "Enum":
      location = `enum ${target.name}`;
      break;
    case "EnumMember":
      location = `enum ${target.enum.name}`;
      break;
    case "Interface":
      location = `interface ${target.name}`;
      break;
    case "Model":
      location = `model ${target.name}`;
      break;
    case "ModelProperty": {
      const model = target.model;
      if (!model) {
        reportDiagnostic(program, {
          code: "missing-type-parent",
          format: { type: "ModelProperty", name: target.name },
          target: target,
        });
      } else {
        location = `property '${target.name}' in model ${model?.name}`;
        if (!model.name) {
          location = `parameter '${target.name}' in operation`;
        }
      }
      break;
    }
    case "Namespace":
      location = `namespace ${target.name}`;
      let invalid: boolean = false;
      const nsName: StringBuilder = new StringBuilder();
      for (const part of name.split(".")) {
        if (!isValidCSharpIdentifier(part)) {
          invalid = true;
          nsName.pushLiteralSegment(transformInvalidIdentifier(part));
        }
      }

      if (invalid) {
        reportDiagnostic(program, {
          code: "invalid-identifier",
          format: { identifier: name, location: location },
          target: target.node ?? NoTarget,
        });
        return nsName.segments.join(".");
      }
      return name;
    case "Operation": {
      const parent = target.interface
        ? `interface ${target.interface.name}`
        : `namespace ${target.namespace?.name}`;
      location = `operation ${target.name} in ${parent}`;
      break;
    }
    case "Union":
      location = `union ${target.name}`;
      break;
    case "UnionVariant": {
      if (target.node !== undefined) {
        const parent = program.checker.getTypeForNode(target.node.parent!);
        if (parent?.kind === "Union")
          location = `variant ${String(target.name)} in union ${parent?.name}`;
      }
      break;
    }
  }

  if (!isValidCSharpIdentifier(name)) {
    reportDiagnostic(program, {
      code: "invalid-identifier",
      format: { identifier: name, location: location },
      target: target.node ?? NoTarget,
    });

    return getCSharpIdentifier(transformInvalidIdentifier(name), context);
  }

  return getCSharpIdentifier(name, context);
}

export function transformInvalidIdentifier(name: string): string {
  const result: StringBuilder = new StringBuilder();
  for (let i = 0; i < name.length; ++i) {
    result.pushLiteralSegment(getValidChar(name.charAt(i), i));
  }
  return result.segments.join("");
}

export function getOperationVerbDecorator(operation: HttpOperation): string {
  switch (operation.verb) {
    case "delete":
      return "HttpDelete";
    case "get":
      return "HttpGet";
    case "patch":
      return "HttpPatch";
    case "post":
      return "HttpPost";
    case "put":
      return "HttpPut";
    default:
      return "HttpGet";
  }
}

export function hasNonMetadataProperties(program: Program, model: Model): boolean {
  const props = [...model.properties.values()].filter((p) => !isMetadata(program, p));

  return props.length > 0;
}

export async function ensureCleanDirectory(program: Program, targetPath: string) {
  try {
    await program.host.stat(targetPath);
    await program.host.rm(targetPath, { recursive: true });
  } catch {}

  await program.host.mkdirp(targetPath);
}

export function isValidCSharpIdentifier(identifier: string): boolean {
  return identifier?.match(/^[A-Za-z_][\w]*$/) !== null;
}

export function getValidChar(target: string, position: number): string {
  if (position === 0) {
    if (target.match(/[A-Za-z_]/)) return target;
    return `Generated_${target.match(/\w/) ? target : ""}`;
  }
  if (!target.match(/[\w]/)) return "_";
  return target;
}

export function getCSharpStatusCode(code: StatusCode): string | undefined {
  switch (code) {
    case "200":
      return "HttpStatusCode.OK";
    case "201":
      return "HttpStatusCode.Created";
    case "202":
      return "HttpStatusCode.Accepted";
    case "204":
      return "HttpStatusCode.NoContent";
    default:
      return undefined;
  }
}
