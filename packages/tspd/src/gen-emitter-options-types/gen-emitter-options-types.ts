import {
  CompilerHost,
  Diagnostic,
  Model,
  ModelProperty,
  NoTarget,
  Program,
  Scalar,
  Type,
  compile,
  createTypeSpecLibrary,
  getDoc,
  isArrayModelType,
  isRecordModelType,
  joinPaths,
  walkPropertiesInherited,
} from "@typespec/compiler";
import prettier from "prettier";

const { createDiagnostic } = createTypeSpecLibrary({
  name: "@typespec/tspd",
  diagnostics: {
    "emitter-options-model-missing": {
      severity: "error",
      messages: {
        default: `Couldn't find an EmitterOptions model in the global namespace.`,
      },
    },
  },
} as const);

const numericScalars = new Set([
  "int8",
  "int16",
  "int32",
  "int64",
  "uint8",
  "uint16",
  "uint32",
  "uint64",
  "integer",
  "safeint",
  "float",
  "float32",
  "float64",
  "numeric",
  "decimal",
  "decimal128",
]);

export interface GenerateEmitterOptionsTypesOptions {
  readonly outputDir: string;
  readonly interfaceName?: string;
}

export interface GenerateEmitterOptionsTypeOptions {
  readonly interfaceName?: string;
  readonly prettierConfig?: prettier.Options;
}

export async function generateEmitterOptionsTypes(
  host: CompilerHost,
  entrypoint: string,
  options: GenerateEmitterOptionsTypesOptions,
): Promise<readonly Diagnostic[]> {
  const program = await compile(host, entrypoint, {
    parseOptions: { comments: true, docs: true },
  });

  if (program.hasError()) {
    return program.diagnostics;
  }

  const emitterOptions = program.getGlobalNamespaceType().models.get("EmitterOptions");
  if (emitterOptions === undefined) {
    return [
      createDiagnostic({
        code: "emitter-options-model-missing",
        target: NoTarget,
      }),
    ];
  }

  const prettierConfig = await prettier.resolveConfig(entrypoint);
  const content = await generateEmitterOptionsType(program, emitterOptions, {
    interfaceName: options.interfaceName,
    prettierConfig: prettierConfig ?? undefined,
  });

  await host.mkdirp(options.outputDir);
  await host.writeFile(joinPaths(options.outputDir, "emitter-options.ts"), content);
  return program.diagnostics;
}

export async function generateEmitterOptionsType(
  program: Program,
  emitterOptions: Model,
  options: GenerateEmitterOptionsTypeOptions = {},
): Promise<string> {
  const interfaceName = options.interfaceName ?? "EmitterOptions";
  const source = `${emitDocComment(getDoc(program, emitterOptions))}export interface ${interfaceName} ${emitObject(
    program,
    emitterOptions,
    new Set(),
  )}`;

  return prettier.format(source, {
    ...options.prettierConfig,
    parser: "typescript",
  });
}

function emitType(program: Program, type: Type, seenModels: Set<Model>): string {
  switch (type.kind) {
    case "Scalar":
      return emitScalar(type);
    case "String":
      return JSON.stringify(type.value);
    case "Number":
      return type.valueAsString;
    case "Boolean":
      return String(type.value);
    case "Enum":
      return joinUnion(
        [...type.members.values()].map((member) =>
          typeof member.value === "string" || typeof member.value === "number"
            ? JSON.stringify(member.value)
            : JSON.stringify(member.name),
        ),
      );
    case "Union":
      return joinUnion(
        [...type.variants.values()].map((variant) => emitType(program, variant.type, seenModels)),
      );
    case "Model":
      if (isArrayModelType(type)) {
        return `${parenthesizeArrayElement(emitType(program, type.indexer.value, seenModels))}[]`;
      }
      if (isRecordModelType(type)) {
        return `Record<string, ${emitType(program, type.indexer.value, seenModels)}>`;
      }
      return emitObject(program, type, seenModels);
    case "Tuple":
      return `[${type.values.map((x) => emitType(program, x, seenModels)).join(", ")}]`;
    case "Intrinsic":
      if (type.name === "null") {
        return "null";
      }
      return "unknown";
    default:
      return "unknown";
  }
}

function emitScalar(type: Scalar): string {
  if (extendsScalar(type, "string")) {
    return "string";
  }
  if (extendsScalar(type, "boolean")) {
    return "boolean";
  }
  if (extendsScalar(type, "bytes")) {
    return "Uint8Array";
  }
  if (extendsAnyScalar(type, numericScalars)) {
    return "number";
  }
  return "unknown";
}

function extendsScalar(type: Scalar, name: string): boolean {
  for (let current: Scalar | undefined = type; current; current = current.baseScalar) {
    if (current.name === name) {
      return true;
    }
  }
  return false;
}

function extendsAnyScalar(type: Scalar, names: Set<string>): boolean {
  for (let current: Scalar | undefined = type; current; current = current.baseScalar) {
    if (names.has(current.name)) {
      return true;
    }
  }
  return false;
}

function emitObject(program: Program, model: Model, seenModels: Set<Model>): string {
  if (seenModels.has(model)) {
    return "Record<string, unknown>";
  }
  const nextSeenModels = new Set(seenModels);
  nextSeenModels.add(model);

  const properties = [...walkPropertiesInherited(model)];
  if (properties.length === 0) {
    return "{}";
  }

  return `{
${properties.map((property) => emitProperty(program, property, nextSeenModels)).join("\n")}
}`;
}

function emitProperty(program: Program, property: ModelProperty, seenModels: Set<Model>): string {
  const doc = emitDocComment(getDoc(program, property), "  ");
  const key = isValidIdentifier(property.name) ? property.name : JSON.stringify(property.name);
  return `${doc}  ${key}${property.optional ? "?" : ""}: ${emitType(program, property.type, seenModels)};`;
}

function emitDocComment(doc: string | undefined, indent = ""): string {
  if (doc === undefined || doc.length === 0) {
    return "";
  }

  const lines = doc.split(/\r?\n/);
  return `${indent}/**
${lines.map((line) => `${indent} *${line.length === 0 ? "" : ` ${line.replaceAll("*/", "*\\/")}`}`).join("\n")}
${indent} */
`;
}

function joinUnion(types: string[]): string {
  const dedupedTypes = [...new Set(types)];
  return dedupedTypes.length === 0 ? "never" : dedupedTypes.join(" | ");
}

function parenthesizeArrayElement(type: string): string {
  return type.includes(" | ") ? `(${type})` : type;
}

function isValidIdentifier(name: string): boolean {
  return /^[$A-Z_a-z][$\w]*$/.test(name);
}
