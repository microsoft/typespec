import {
  DocTag,
  FunctionParameter,
  IntrinsicScalarName,
  Model,
  Program,
  Scalar,
  Type,
  ValueType,
  getSourceLocation,
  isUnknownType,
} from "../../core/index.js";
import { Doc, renderDoc } from "./doc-builder.js";
import { DecoratorSignature } from "./types.js";

const line = "\n";
export function generateSignatureTests(
  importName: string,
  decoratorSignatureImport: string,
  decorators: DecoratorSignature[]
): string {
  const content: Doc[] = [];
  content.push([
    "/** An error here would mean that the decorator is not exported or doesn't have the right name. */",
    line,
    "import {",
    decorators.map((x) => x.jsName).join(","),
    `} from "`,
    importName,
    `";`,
    line,
  ]);

  content.push([
    "import {",
    decorators.map((x) => x.typeName).join(","),
    `} from "`,
    decoratorSignatureImport,
    `";`,
    line,
  ]);
  content.push(line);

  content.push([
    "type Decorators = {",
    line,
    decorators.map((x) => renderDoc([x.jsName, ": ", x.typeName])).join(","),

    "};",
    line,
  ]);

  content.push(line);

  content.push([
    "/** An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ... */",
    line,
    "const _: Decorators = {",
    line,
    decorators.map((x) => x.jsName).join(","),

    "};",
    line,
  ]);
  return renderDoc(content);
}

export function generateSignatures(program: Program, decorators: DecoratorSignature[]): string {
  const compilerImports = new Set<string>();
  const decoratorDeclarations: string[] = decorators.map((x) => getTSSignatureForDecorator(x));

  const content: Doc = [
    `import {${[...compilerImports].join(",")}} from "@typespec/compiler";`,
    line,
    line,
    decoratorDeclarations.join("\n\n"),
  ];

  return renderDoc(content);

  function useCompilerType(name: string) {
    compilerImports.add(name);
    return name;
  }

  function getTSSignatureForDecorator({ typeName, decorator }: DecoratorSignature): string {
    const args =
      decorator.parameters.length > 0
        ? `,${decorator.parameters.map((x) => getTSParameter(x)).join(",")}`
        : "";

    return [
      getDocComment(decorator),
      "export type ",
      typeName,
      " = ",
      `(context: ${useCompilerType("DecoratorContext")}, ${getTSParameter(
        decorator.target,
        true
      )}${args}) => void;`,
    ].join("");
  }

  function getTSParameter(param: FunctionParameter, isTarget?: boolean): string {
    const optional = param.optional ? "?" : "";
    return `${param.name}${optional}: ${getTSParmeterType(param.type, isTarget)}`;
  }

  function getTSParmeterType(type: Type | ValueType, isTarget?: boolean): string {
    if (type.kind === "Value") {
      return getValueTSType(type.target);
    }
    if (isTarget && isUnknownType(type)) {
      return useCompilerType("Type");
    }
    if (type.kind === "Model" && isReflectionType(type)) {
      return useCompilerType(type.name);
    }
    return useCompilerType("TypeSpecValue");
  }

  function getValueTSType(type: Type): string {
    switch (type.kind) {
      case "Boolean":
        return `${type.value}`;
      case "String":
        return `"${type.value}"`;
      case "Number":
        return `${type.value}`;
      case "Scalar":
        return getScalarTSType(type);
    }
    return "unknown";
  }

  function getScalarTSType(scalar: Scalar): string {
    const isStd = program.checker.isStdType(scalar);
    if (isStd) {
      return getStdScalarTSType(scalar);
    } else if (scalar.baseScalar) {
      return getScalarTSType(scalar.baseScalar);
    } else {
      return "unknown";
    }
  }

  function getStdScalarTSType(scalar: Scalar & { name: IntrinsicScalarName }): string {
    switch (scalar.name) {
      case "numeric":
      case "integer":
      case "int8":
      case "int16":
      case "int32":
      case "int64":
      case "safeint":
      case "uint8":
      case "uint16":
      case "uint32":
      case "uint64":
      case "float":
      case "float64":
      case "float32":
      case "decimal":
      case "decimal128":
        return "number";
      case "string":
      case "url":
        return "string";
      case "boolean":
        return "boolean";
      case "plainDate":
      case "utcDateTime":
      case "offsetDateTime":
      case "plainTime":
      case "duration":
      case "bytes":
        return "unknown";
      default:
        const _assertNever: never = scalar.name;
        return "unknown";
    }
  }
}

function isReflectionType(type: Type): type is Model {
  return (
    type.kind === "Model" &&
    type.namespace?.name === "Reflection" &&
    type.namespace?.namespace?.name === "TypeSpec"
  );
}

function getDocComment(type: Type): string {
  const docs = type.node?.docs;
  if (docs === undefined) {
    return "";
  }

  const mainContentLines: string[] = [];
  const tagLines = [];
  for (const doc of docs) {
    for (const content of doc.content) {
      for (const line of content.text.split("\n")) {
        mainContentLines.push(line);
      }
    }
    for (const tag of doc.tags) {
      tagLines.push();

      let first = true;
      const hasContentFirstLine = checkIfTagHasDocOnSameLine(tag);
      for (const content of tag.content) {
        for (const line of content.text.split("\n")) {
          if (first) {
            if (hasContentFirstLine) {
              tagLines.push(`@${tag.tagName.sv} ${line}`);
            } else {
              tagLines.push(`@${tag.tagName.sv}`, line);
            }

            first = false;
          } else {
            tagLines.push(line);
          }
        }
      }
    }
  }

  const docLines = [...mainContentLines, ...(tagLines.length > 0 ? [""] : []), ...tagLines];
  return "/**\n" + docLines.map((x) => `* ${x}`).join("\n") + "\n*/\n";
}

function checkIfTagHasDocOnSameLine(tag: DocTag): boolean {
  const start = tag.content[0]?.pos;
  const end = tag.content[0]?.end;
  const file = getSourceLocation(tag.content[0]).file;

  let hasFirstLine = false;
  for (let i = start; i < end; i++) {
    const ch = file.text[i];
    if (ch === "\n") {
      break;
    }
    // Todo reuse compiler whitespace logic or have a way to get this info from the parser.
    if (ch !== " ") {
      hasFirstLine = true;
    }
  }
  return hasFirstLine;
}
