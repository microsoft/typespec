import { Refkey, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { useTransformNamePolicy } from "@typespec/emitter-framework";
import * as ef from "@typespec/emitter-framework/typescript";
import { HttpOperation } from "@typespec/http";
import { hasDefaultValue } from "../utils/parameters.jsx";
import { getOperationOptionsTypeRefkey } from "./operation-options.jsx";

export interface OperationParametersProps {
  operation: HttpOperation;
}

export function getOperationParameters(
  operation: HttpOperation,
  optionsRefkey: Refkey,
): ts.ParameterDescriptor[] {
  const transformNamer = useTransformNamePolicy();
  const requiredParameters = operation.parameters.properties
    .filter((p) => !p.property.optional && !hasDefaultValue(p))
    .filter((p) => p.path.length === 1);

  const parameters: ts.ParameterDescriptor[] = [];

  for (const parameter of requiredParameters) {
    const name = transformNamer.getApplicationName(parameter.property);
    const parameterDescriptor: ts.ParameterDescriptor = {
      name,
      refkey: refkey(),
      type: <ef.TypeExpression type={parameter.property.type} />,
    };

    parameters.push(parameterDescriptor);
  }

  parameters.push({
    name: "options",
    refkey: optionsRefkey,
    type: getOperationOptionsTypeRefkey(operation),
    optional: true,
  });

  return parameters;
}
