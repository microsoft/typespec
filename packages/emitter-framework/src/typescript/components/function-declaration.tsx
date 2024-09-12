import { Children, refkey as getRefkey, mapJoin } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import {
  Model,
  Operation,
  isErrorModel,
} from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { TypeExpression } from "./type-expression.js";

export interface FunctionDeclarationPropsWithType
  extends Omit<ts.FunctionDeclarationProps, "name"> {
  type: Operation;
  name?: string;
}

export type FunctionDeclarationProps =
  | FunctionDeclarationPropsWithType
  | ts.FunctionDeclarationProps;

export function FunctionDeclaration(props: FunctionDeclarationProps) {
  if (!isTypedFunctionDeclarationProps(props)) {
    if (!props.name) {
    }
    return <ts.FunctionDeclaration {...props} />;
  }

  const { type, ...coreProps } = props;
  const refkey = coreProps.refkey ?? getRefkey(type);

  let functionName = props.name
    ? props.name
    : ts.useTSNamePolicy().getName(type.name, "function");


    // TODO: This should probably be a broader check in alloy to guard\
    // any identifier.
    if(reservedFunctionKeywords.has(functionName)) {
      functionName = `${functionName}_`;
    }

  const returnType = props.returnType ?? getReturnType(type);

  coreProps.refkey ??= getRefkey(type);

  const _props: ts.FunctionDeclarationProps = {
    ...coreProps,
    name: functionName,
    returnType,
  };

  return (
    <ts.FunctionDeclaration {..._props} refkey={refkey}>
      {getParameters(type.parameters, { params: props.parameters })}
      {props.children}
    </ts.FunctionDeclaration>
  );
}

export interface TypedFunctionParametersProps extends Omit<ts.FunctionDeclarationProps, "name"> {
  type: Model;
  name?: string;
}

export type FunctionParametersProps = TypedFunctionParametersProps | ts.FunctionParametersProps;

FunctionDeclaration.Parameters = function Parameters(props: FunctionParametersProps) {
  if (!isTypedFunctionParametersProps(props)) {
    return <ts.FunctionDeclaration.Parameters {...props} />;
  }

  const { type, ...coreProps } = props;

  const parameters = getParameters(type);
  return <ts.FunctionDeclaration.Parameters {...coreProps} parameters={parameters} />;
};

function getParameters(
  type: Model,
  {
    params = {},
    location = "start",
  }: { params?: Record<string, Children | ts.ParameterDescriptor>; location?: "start" | "end" } = {}
) {
  const namePolicy = ts.useTSNamePolicy();

  // Utility function to create parameter name
  const createParameterName = (key: string, isOptional: boolean) => {
    let name = namePolicy.getName(key, "parameter");
    return isOptional ? `${name}?` : name;
  };

  // Utility function to convert type properties to parameters
  const getOperationParams = (type: Model): Map<string, Children | ts.ParameterDescriptor> => {
    const params = new Map<string, Children | ts.ParameterDescriptor>();

    type.properties.forEach((prop, key) => {
      const paramName = createParameterName(key, prop.optional);
      params.set(paramName, <TypeExpression type={prop.type} />);
    });

    return params;
  };

  const operationParams = getOperationParams(type);
  const extraParamsMap = new Map(Object.entries(params));

  // Merge parameters based on location
  const allParams =
    location === "end"
      ? new Map([...operationParams, ...extraParamsMap])
      : new Map([...extraParamsMap, ...operationParams]);

  return (
    <ts.FunctionDeclaration.Parameters>
      {mapJoin(
        allParams,
        (key, value) => (
          <>
            {key}: {value}
          </>
        ),
        { joiner: ", " }
      )}
    </ts.FunctionDeclaration.Parameters>
  );
}

function isTypedFunctionDeclarationProps(
  props: FunctionDeclarationProps
): props is FunctionDeclarationPropsWithType {
  return "type" in props;
}

function isTypedFunctionParametersProps(
  props: FunctionParametersProps
): props is TypedFunctionParametersProps {
  return "type" in props;
}


function getReturnType(
  type: Operation,
  options: { skipErrorFiltering: boolean } = { skipErrorFiltering: false }
) {
  const returnType = type.returnType;

  if (options.skipErrorFiltering || returnType.kind !== "Union") {
    return <TypeExpression type={returnType} />; 
  }
  
  const variants = [...returnType.variants.values()].filter(v => !isErrorModel($.program, v.type));
  return mapJoin(variants, (variant) => {
    return <TypeExpression type={variant.type} />;
  }, { joiner: " | " });
}

const reservedFunctionKeywords = new Set([
  "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do", "else",
  "enum", "export", "extends", "finally", "for", "function", "if", "import", "in", "instanceof", "new", 
  "return", "super", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with", "yield", 
  "let", "static", "implements", "interface", "package", "private", "protected", "public", "await"
]);
