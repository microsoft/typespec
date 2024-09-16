import {
  DocTag,
  IntrinsicScalarName,
  MixedFunctionParameter,
  MixedParameterConstraint,
  Model,
  Program,
  Scalar,
  SyntaxKind,
  Type,
  getSourceLocation,
  isArrayModelType,
  isUnknownType,
} from "@typespec/compiler";
import { Doc, renderDoc } from "./doc-builder.js";
import { DecoratorSignature } from "./types.js";

const line = "\n";
export function generateSignatureTests(
  namespaceName: string,
  importName: string,
  decoratorSignatureImport: string,
  decorators: DecoratorSignature[],
): string {
  const content: Doc[] = [];
  const decRecord = getDecoratorRecordForNamespaceName(namespaceName);
  content.push([
    "/** An error here would mean that the decorator is not exported or doesn't have the right name. */",
    line,
    `import { $decorators } from "`,
    importName,
    `";`,
    line,
  ]);

  content.push(`import type { ${decRecord} } from "${decoratorSignatureImport}";`);

  content.push(line);

  content.push([
    "/** An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ... */",
    line,
    `const _: ${decRecord} = $decorators["${namespaceName}"]`,
  ]);
  return renderDoc(content);
}

function getDecoratorRecordForNamespaceName(namespaceName: string) {
  return `${namespaceName.replaceAll(".", "")}Decorators`;
}
export function generateSignatures(
  program: Program,
  decorators: DecoratorSignature[],
  namespaceName: string,
): string {
  const compilerImports = new Set<string>();
  const localTypes = new Set<Model>();
  const decoratorDeclarations: string[] = decorators.map((x) => getTSSignatureForDecorator(x));

  const importArray = [...compilerImports].sort();

  const localTypeDeclarations = [];
  for (const item of localTypes) {
    localTypeDeclarations.push(declareInterfaceForModel(item));
  }
  const content: Doc = [
    `import type {${importArray.join(",")}} from "@typespec/compiler";`,
    line,
    line,
    localTypeDeclarations.join("\n\n"),
    line,
    line,
    decoratorDeclarations.join("\n\n"),
    line,
    line,
  ];

  content.push([
    `export type ${getDecoratorRecordForNamespaceName(namespaceName)} = {`,
    line,
    decorators.map((x) => renderDoc([x.name.slice(1), ": ", x.typeName])).join(","),
    "};",
    line,
  ]);

  content.push(line);

  return renderDoc(content);

  function useCompilerType(name: string) {
    compilerImports.add(name);
    return name;
  }

  function useLocalType(type: Model) {
    localTypes.add(type);
    return type.name;
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
        true,
      )}${args}) => void;`,
    ].join("");
  }

  function getTSParameter(param: MixedFunctionParameter, isTarget?: boolean): string {
    const optional = param.optional ? "?" : "";
    const rest = param.rest ? "..." : "";
    if (rest) {
      return `...${param.name}${optional}: ${getRestTSParmeterType(param.type)}`;
    } else {
      return `${param.name}${optional}: ${getTSParmeterType(param.type, isTarget)}`;
    }
  }

  /** For a rest param of constraint T[] or valueof T[] return the T or valueof T */
  function extractRestParamConstraint(
    constraint: MixedParameterConstraint,
  ): MixedParameterConstraint | undefined {
    let valueType: Type | undefined;
    let type: Type | undefined;
    if (constraint.valueType) {
      if (
        constraint.valueType.kind === "Model" &&
        isArrayModelType(program, constraint.valueType)
      ) {
        valueType = constraint.valueType.indexer.value;
      } else {
        return undefined;
      }
    }
    if (constraint.type) {
      if (constraint.type.kind === "Model" && isArrayModelType(program, constraint.type)) {
        type = constraint.type.indexer.value;
      } else {
        return undefined;
      }
    }

    return {
      entityKind: "MixedParameterConstraint",
      type,
      valueType,
    };
  }
  function getRestTSParmeterType(constraint: MixedParameterConstraint) {
    const restItemConstraint = extractRestParamConstraint(constraint);
    if (restItemConstraint === undefined) {
      return "unknown";
    }
    return `(${getTSParmeterType(restItemConstraint)})[]`;
  }

  function getTSParmeterType(constraint: MixedParameterConstraint, isTarget?: boolean): string {
    if (constraint.type && constraint.valueType) {
      return `${getTypeConstraintTSType(constraint.type, isTarget)} | ${getValueTSType(constraint.valueType)}`;
    }
    if (constraint.valueType) {
      return getValueTSType(constraint.valueType);
    } else if (constraint.type) {
      return getTypeConstraintTSType(constraint.type, isTarget);
    }

    return useCompilerType("Type");
  }

  function getTypeConstraintTSType(type: Type, isTarget?: boolean): string {
    if (isTarget && isUnknownType(type)) {
      return useCompilerType("Type");
    }
    if (type.kind === "Model" && isReflectionType(type)) {
      return useCompilerType(type.name);
    } else if (type.kind === "Union") {
      const variants = [...type.variants.values()];

      if (isTarget) {
        const items = [...new Set(variants.map((x) => getTypeConstraintTSType(x.type, isTarget)))];
        return items.join(" | ");
      } else if (variants.every((x) => isReflectionType(x.type))) {
        return variants.map((x) => useCompilerType((x.type as Model).name)).join(" | ");
      } else {
        return useCompilerType("Type");
      }
    } else if (isTarget) {
      // Special case for target type if it is a scalar type(e.g. `string`) then it can only be a Scalar.
      // In the case of regular parameter it could also be a union of the scalar, or a literal matching the scalar or union of both,
      // so we only change that when isTarget is true.
      if (type.kind === "Scalar") {
        return useCompilerType(type.kind);
      }
    }
    return useCompilerType("Type");
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
      case "Union":
        return [...type.variants.values()].map((x) => getValueTSType(x.type)).join(" | ");
      case "Model":
        if (isArrayModelType(program, type)) {
          return `readonly (${getValueTSType(type.indexer.value)})` + "[]";
        } else if (isReflectionType(type)) {
          return getValueOfReflectionType(type);
        } else {
          if (type.name) {
            return useLocalType(type);
          } else {
            return writeTypeExpressionForModel(type);
          }
        }
    }
    return "unknown";
  }

  function getValueOfReflectionType(type: Model): string {
    switch (type.name) {
      case "EnumMember":
      case "Enum":
        return useCompilerType("EnumValue");
      case "Model":
        return "Record<string, unknown>";
      default:
        return "unknown";
    }
  }

  function writeTypeExpressionForModel(model: Model): string {
    const properties = [...model.properties.values()].map((x) => {
      return `readonly ${x.name}${x.optional ? "?" : ""}: ${getValueTSType(x.type)}`;
    });

    return `{ ${properties.join(", ")} }`;
  }

  function declareInterfaceForModel(model: Model): string {
    return `export interface ${model.name} ${writeTypeExpressionForModel(model)}`;
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
      case "decimal":
      case "decimal128":
      case "float":
      case "integer":
      case "int64":
      case "uint64":
        return useCompilerType("Numeric");
      case "int8":
      case "int16":
      case "int32":
      case "safeint":
      case "uint8":
      case "uint16":
      case "uint32":
      case "float64":
      case "float32":
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

function isReflectionType(type: Type): type is Model & { namespace: { name: "Reflection" } } {
  return (
    type.kind === "Model" &&
    type.namespace?.name === "Reflection" &&
    type.namespace?.namespace?.name === "TypeSpec"
  );
}

function getDocComment(type: Type): string {
  const docs = type.node?.docs;
  if (docs === undefined || docs.length === 0) {
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
      const tagStart =
        tag.kind === SyntaxKind.DocParamTag || tag.kind === SyntaxKind.DocTemplateTag
          ? `@${tag.tagName.sv} ${tag.paramName.sv}`
          : `@${tag.tagName.sv}`;
      for (const content of tag.content) {
        for (const line of content.text.split("\n")) {
          const cleaned = sanitizeDocComment(line);
          if (first) {
            if (hasContentFirstLine) {
              tagLines.push(`${tagStart} ${cleaned}`);
            } else {
              tagLines.push(tagStart, cleaned);
            }

            first = false;
          } else {
            tagLines.push(cleaned);
          }
        }
      }
    }
  }

  const docLines = [...mainContentLines, ...(tagLines.length > 0 ? [""] : []), ...tagLines];
  return "/**\n" + docLines.map((x) => `* ${x}`).join("\n") + "\n*/\n";
}

function sanitizeDocComment(doc: string): string {
  // Issue to escape @internal and other tsdoc tags https://github.com/microsoft/TypeScript/issues/47679
  return doc.replaceAll("@internal", `@_internal`);
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
