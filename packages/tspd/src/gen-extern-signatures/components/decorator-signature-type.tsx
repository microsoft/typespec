import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Model, type Type, getSourceLocation, isUnknownType } from "@typespec/compiler";
import { DocTag, SyntaxKind } from "@typespec/compiler/ast";
import { typespecCompiler } from "../external-packages/compiler.js";
import { DecoratorSignature } from "../types.js";

export interface DecoratorSignatureProps {
  signature: DecoratorSignature;
}

/** Render the type of decorator implementation function  */
export function DecoratorSignatureType(props: Readonly<DecoratorSignatureProps>) {
  const decorator = props.signature.decorator;
  const parameters: ts.ParameterDescriptor[] = [
    {
      name: "context",
      type: typespecCompiler.DecoratorContext,
    },
    {
      name: "target",
      type: <TargetParameterTsType type={decorator.target.type.type} />,
    },
  ];
  return (
    <ts.TypeDeclaration
      export
      name={props.signature.typeName}
      doc={getDocComment(props.signature.decorator)}
    >
      <ts.FunctionType parameters={parameters} />
    </ts.TypeDeclaration>
  );
}

// export interface ParameterTsTypeProps {
//   constraint: MixedParameterConstraint;
// }
// export function ParameterTsType({ constraint }: ParameterTsTypeProps) {
//   if (constraint.type && constraint.valueType) {
//     return `${getTypeConstraintTSType(constraint.type)} | ${getValueTSType(constraint.valueType)}`;
//   }
//   if (constraint.valueType) {
//     return getValueTSType(constraint.valueType);
//   } else if (constraint.type) {
//     return getTypeConstraintTSType(constraint.type);
//   }

//   return typespecCompiler.Type;
// }

function TargetParameterTsType(props: { type: Type | undefined }) {
  const type = props.type;
  if (type === undefined || isUnknownType(type)) {
    return typespecCompiler.Type;
  } else if (type.kind === "Model" && isReflectionType(type)) {
    return (typespecCompiler as any)[type.name];
  } else if (type.kind === "Union") {
    const variants = [...new Set([...type.variants.values()])].map((x) => (
      <TargetParameterTsType type={x} />
    ));
    return ay.join(variants, { joiner: " | " });
  } else if (type.kind === "Scalar") {
    // Special case for target type if it is a scalar type(e.g. `string`) then it can only be a Scalar.
    // In the case of regular parameter it could also be a union of the scalar, or a literal matching the scalar or union of both,
    // so we only change that when isTarget is true.
    return typespecCompiler.Scalar;
  }
}

function getTypeConstraintTSType(type: Type) {
  if (type.kind === "Model" && isReflectionType(type)) {
    return (typespecCompiler as any)[type.name];
  } else if (type.kind === "Union") {
    const variants = [...type.variants.values()];

    if (variants.every((x) => isReflectionType(x.type))) {
      return variants.map((x) => useCompilerType((x.type as Model).name)).join(" | ");
    } else {
      return typespecCompiler.Type;
    }
  }
  return typespecCompiler.Type;
}

function useCompilerType(name: string) {
  return (typespecCompiler as any)[name];
}

// function getValueTSType(type: Type) {
//   switch (type.kind) {
//     case "Boolean":
//       return `${type.value}`;
//     case "String":
//       return `"${type.value}"`;
//     case "Number":
//       return `${type.value}`;
//     case "Scalar":
//       return getScalarTSType(type);
//     case "Union":
//       return [...type.variants.values()].map((x) => getValueTSType(x.type)).join(" | ");
//     case "Model":
//       if (isArrayModelType(program, type)) {
//         return `readonly (${getValueTSType(type.indexer.value)})` + "[]";
//       } else if (isReflectionType(type)) {
//         return getValueOfReflectionType(type);
//       } else {
//         // If its exactly the record type use Record<string, T> instead of the model name.
//         if (type.indexer && type.name === "Record" && type.namespace?.name === "TypeSpec") {
//           return `Record<string, ${getValueTSType(type.indexer.value)}>`;
//         }
//         if (type.name) {
//           return useLocalType(type);
//         } else {
//           return writeTypeExpressionForModel(type);
//         }
//       }
//   }
//   return "unknown";
// }

// function getScalarTSType(scalar: Scalar): string {
//   const isStd = program.checker.isStdType(scalar);
//   if (isStd) {
//     return getStdScalarTSType(scalar);
//   } else if (scalar.baseScalar) {
//     return getScalarTSType(scalar.baseScalar);
//   } else {
//     return "unknown";
//   }
// }

function isReflectionType(type: Type): type is Model & { namespace: { name: "Reflection" } } {
  return (
    type.kind === "Model" &&
    type.namespace?.name === "Reflection" &&
    type.namespace?.namespace?.name === "TypeSpec"
  );
}

function getValueOfReflectionType(type: Model) {
  switch (type.name) {
    case "EnumMember":
    case "Enum":
      return typespecCompiler.EnumValue;
    case "Model":
      return "Record<string, unknown>";
    default:
      return "unknown";
  }
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
  return docLines.join("\n");
  // return "/**\n" + docLines.map((x) => `* ${x}`).join("\n") + "\n*/\n";
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

export function renderDecoratorSignature(signature: DecoratorSignature): string {
  const comp = <DecoratorSignatureType signature={signature} />;
  return ay.printTree(
    ay.renderTree(
      <ay.Output externals={[typespecCompiler]}>
        <ts.SourceFile path="foo.tsx">{comp}</ts.SourceFile>
      </ay.Output>,
    ),
  );
}
