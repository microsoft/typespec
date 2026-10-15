import * as ts from "@alloy-js/typescript";
import type { Model, Operation } from "@typespec/compiler";
import { useTsp } from "../../core/index.js";
import { buildParameterDescriptors, getReturnType } from "../utils/operation.js";
import { declarationRefkeys } from "../utils/refkey.js";
import { TypeExpression } from "./type-expression.js";

/** Function options with an operation supplying default documentation, parameters, and return type. */
export interface FunctionDeclarationPropsWithType extends Omit<
  ts.FunctionDeclarationProps,
  "name"
> {
  /** Operation represented by the function; also provides its reference identity. */
  type: Operation;
  /** Name override; otherwise the operation name uses the TypeScript function naming policy. */
  name?: string;
  /** Explicit parameters precede generated ones by default; append or replace them instead. */
  parametersMode?: "prepend" | "append" | "replace";
}

/** Props for either an operation-backed declaration or an ordinary Alloy function declaration. */
export type FunctionDeclarationProps =
  FunctionDeclarationPropsWithType | ts.FunctionDeclarationProps;

/**
 * A TypeScript function declaration. Pass the `type` prop to create the
 * function declaration by converting from a TypeSpec Operation. Any other props
 * provided will take precedence.
 */
export function FunctionDeclaration(props: FunctionDeclarationProps) {
  const { $ } = useTsp();

  if (!isTypedFunctionDeclarationProps(props)) {
    return <ts.FunctionDeclaration {...props} />;
  }

  const refkeys = declarationRefkeys(props.refkey, props.type);

  let name = props.name ? props.name : ts.useTSNamePolicy().getName(props.type.name, "function");

  // TODO: This should probably be a broader check in alloy to guard\
  // any identifier.
  if (reservedFunctionKeywords.has(name)) {
    name = `${name}_`;
  }

  const returnType = props.returnType ?? <TypeExpression type={getReturnType(props.type)} />;
  const allParameters = buildParameterDescriptors(props.type.parameters, {
    params: props.parameters,
    mode: props.parametersMode,
  });
  const doc = props.doc ?? $.type.getDoc(props.type);
  return (
    <ts.FunctionDeclaration
      doc={doc}
      refkey={refkeys}
      name={name}
      async={props.async}
      default={props.default}
      export={props.export}
      kind={props.kind}
      returnType={returnType}
      parameters={allParameters}
    >
      {props.children}
    </ts.FunctionDeclaration>
  );
}

/** Parameter-list options for {@link FunctionDeclaration.Parameters} backed by a TypeSpec model. */
export interface TypedFunctionParametersProps extends Omit<ts.FunctionDeclarationProps, "name"> {
  /** Model whose properties become parameters, including inherited properties. */
  type: Model;
  /** Accepted for declaration-props compatibility; does not affect the rendered parameter list. */
  name?: string;
}

/** Selects model-derived parameters or a manually supplied Alloy parameter list. */
export type FunctionParametersProps = TypedFunctionParametersProps | ts.FunctionParametersProps;

/** Renders only a function's parameter list, deriving descriptors from `type` when provided. */
FunctionDeclaration.Parameters = function Parameters(props: FunctionParametersProps) {
  if (!isTypedFunctionParametersProps(props)) {
    return <ts.FunctionDeclaration.Parameters {...props} />;
  }

  const parameterDescriptors = buildParameterDescriptors(props.type);
  return (
    <ts.FunctionDeclaration.Parameters parameters={parameterDescriptors}>
      {props.children}
    </ts.FunctionDeclaration.Parameters>
  );
};

function isTypedFunctionDeclarationProps(
  props: FunctionDeclarationProps,
): props is FunctionDeclarationPropsWithType {
  return "type" in props;
}

function isTypedFunctionParametersProps(
  props: FunctionParametersProps,
): props is TypedFunctionParametersProps {
  return "type" in props;
}

const reservedFunctionKeywords = new Set([
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
  "let",
  "static",
  "implements",
  "interface",
  "package",
  "private",
  "protected",
  "public",
  "await",
]);
