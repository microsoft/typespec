import { For, join, List, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import {
  getSourceLocation,
  IntrinsicScalarName,
  isArrayModelType,
  isUnknownType,
  MixedParameterConstraint,
  Model,
  Program,
  Scalar,
  type Type,
} from "@typespec/compiler";
import { DocTag, SyntaxKind } from "@typespec/compiler/ast";
import { typespecCompiler } from "../external-packages/compiler.js";
import { DecoratorSignature } from "../types.js";
import { useTspd } from "./tspd-context.js";

export interface DecoratorSignatureProps {
  signature: DecoratorSignature;
}

/** Render the type of decorator implementation function  */
export function DecoratorSignatureType(props: Readonly<DecoratorSignatureProps>) {
  const { program } = useTspd();
  const decorator = props.signature.decorator;
  const parameters: ts.ParameterDescriptor[] = [
    {
      name: "context",
      type: typespecCompiler.DecoratorContext,
    },
    {
      name: decorator.target.name,
      type: <TargetParameterTsType type={decorator.target.type.type} />,
    },
    ...decorator.parameters.map(
      (param): ts.ParameterDescriptor => ({
        // https://github.com/alloy-framework/alloy/issues/144
        name: param.rest ? `...${param.name}` : param.name,
        type: param.rest ? (
          <>
            (
            {param.type ? (
              <ParameterTsType constraint={extractRestParamConstraint(program, param.type)!} />
            ) : undefined}
            )[]
          </>
        ) : (
          <ParameterTsType constraint={param.type} />
        ),
        optional: param.optional,
      }),
    ),
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

/** For a rest param of constraint T[] or valueof T[] return the T or valueof T */
function extractRestParamConstraint(
  program: Program,
  constraint: MixedParameterConstraint,
): MixedParameterConstraint | undefined {
  let valueType: Type | undefined;
  let type: Type | undefined;
  if (constraint.valueType) {
    if (constraint.valueType.kind === "Model" && isArrayModelType(program, constraint.valueType)) {
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

export interface ParameterTsTypeProps {
  constraint: MixedParameterConstraint;
}
export function ParameterTsType({ constraint }: ParameterTsTypeProps) {
  if (constraint.type && constraint.valueType) {
    return (
      <>
        <TypeConstraintTSType type={constraint.type} />
        {" | "}
        <ValueTsType type={constraint.valueType} />
      </>
    );
  }
  if (constraint.valueType) {
    return <ValueTsType type={constraint.valueType} />;
  } else if (constraint.type) {
    return <TypeConstraintTSType type={constraint.type} />;
  }

  return typespecCompiler.Type;
}

function TargetParameterTsType(props: { type: Type | undefined }) {
  const type = props.type;
  if (type === undefined) {
    return typespecCompiler.Type;
  }
  if (type.kind === "Union") {
    const variants = [...type.variants.values()].map((x) => x.type).map(getTargetType);
    return join(new Set(variants).values(), { joiner: " | " });
  } else {
    return getTargetType(type);
  }
}

function getTargetType(type: Type) {
  if (type === undefined || isUnknownType(type)) {
    return typespecCompiler.Type;
  } else if (type.kind === "Model" && isReflectionType(type)) {
    return (typespecCompiler as any)[type.name];
  } else if (type.kind === "Scalar") {
    // Special case for target type if it is a scalar type(e.g. `string`) then it can only be a Scalar.
    // In the case of regular parameter it could also be a union of the scalar, or a literal matching the scalar or union of both,
    // so we only change that when isTarget is true.
    return typespecCompiler.Scalar;
  } else {
    return typespecCompiler.Type;
  }
}

function TypeConstraintTSType({ type }: { type: Type }) {
  if (type.kind === "Model" && isReflectionType(type)) {
    return (typespecCompiler as any)[type.name];
  } else if (type.kind === "Union") {
    const variants = [...type.variants.values()].map((x) => x.type);

    if (variants.every((x) => isReflectionType(x))) {
      return join(
        [...new Set(variants)].map((x) => getCompilerType((x as Model).name)),
        {
          joiner: " | ",
        },
      );
    } else {
      return typespecCompiler.Type;
    }
  }
  return typespecCompiler.Type;
}

function getCompilerType(name: string) {
  return (typespecCompiler as any)[name];
}

function ValueTsType({ type }: { type: Type }) {
  const { program } = useTspd();
  switch (type.kind) {
    case "Boolean":
      return `${type.value}`;
    case "String":
      return `"${type.value}"`;
    case "Number":
      return `${type.value}`;
    case "Scalar":
      return <ScalarTsType scalar={type} />;
    case "Union":
      return join(
        [...type.variants.values()].map((x) => <ValueTsType type={x.type} />),
        { joiner: " | " },
      );
    case "Model":
      if (isArrayModelType(program, type)) {
        return (
          <>
            readonly (<ValueTsType type={type.indexer.value} />
            )[]
          </>
        );
      } else if (isReflectionType(type)) {
        return getValueOfReflectionType(type);
      } else {
        // If its exactly the record type use Record<string, T> instead of the model name.
        if (type.indexer && type.name === "Record" && type.namespace?.name === "TypeSpec") {
          return (
            <>
              Record{"<string, "}
              <ValueTsType type={type.indexer.value} />
              {">"}
            </>
          );
        }
        if (type.name) {
          return <LocalTypeReference type={type} />;
        } else {
          return <ValueOfModelTsType model={type} />;
        }
      }
  }
  return "unknown";
}

function LocalTypeReference({ type }: { type: Model }) {
  const { addLocalType } = useTspd();
  addLocalType(type);
  return <ts.Reference refkey={refkey(type)} />;
}
function ValueOfModelTsType({ model }: { model: Model }) {
  return (
    <ts.InterfaceExpression>
      <ValueOfModelTsInterfaceBody model={model} />
    </ts.InterfaceExpression>
  );
}

export function ValueOfModelTsInterfaceBody({ model }: { model: Model }) {
  return (
    <List joiner=";" enderPunctuation>
      {model.indexer?.value && (
        <ts.InterfaceMember
          readonly
          indexer="key: string"
          type={<ValueTsType type={model.indexer.value} />}
        />
      )}
      <For each={model.properties.values()}>
        {(x) => (
          <ts.InterfaceMember
            readonly
            name={x.name}
            optional={x.optional}
            type={<ValueTsType type={x.type} />}
          />
        )}
      </For>
    </List>
  );
}

function ScalarTsType({ scalar }: { scalar: Scalar }) {
  const { program } = useTspd();
  const isStd = program.checker.isStdType(scalar);
  if (isStd) {
    return getStdScalarTSType(scalar);
  } else if (scalar.baseScalar) {
    return <ScalarTsType scalar={scalar.baseScalar} />;
  } else {
    return "unknown";
  }
}

function getStdScalarTSType(scalar: Scalar & { name: IntrinsicScalarName }) {
  switch (scalar.name) {
    case "numeric":
    case "decimal":
    case "decimal128":
    case "float":
    case "integer":
    case "int64":
    case "uint64":
      return typespecCompiler.Numeric;
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
