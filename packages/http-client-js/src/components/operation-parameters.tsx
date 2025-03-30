import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { useTransformNamePolicy } from "@typespec/emitter-framework";
import * as ef from "@typespec/emitter-framework/typescript";
import { HttpOperation } from "@typespec/http";
import { hasDefaultValue } from "../utils/parameters.jsx";
import { getOperationOptionsTypeRefkey } from "./operation-options.jsx";

export interface OperationParametersProps {
  operation: HttpOperation;
}

export function getOperationOptionsParameterRefkey(operation: HttpOperation) {
  return ay.refkey(operation, "operation-options-parameter");
}

export function getOperationParameters(
  operation: HttpOperation,
): Record<string, ts.ParameterDescriptor | ay.Children> {
  const transformNamer = useTransformNamePolicy();
  const requiredParameters = operation.parameters.properties.filter(
    (p) => !p.property.optional && !hasDefaultValue(p),
  );

  const parameters: Record<string, ts.ParameterDescriptor | ay.Children> = {};

  for (const parameter of requiredParameters) {
    const parameterDescriptor: ts.ParameterDescriptor = {
      refkey: ay.refkey(parameter.property, "operation-parameter"),
      type: <ef.TypeExpression type={parameter.property.type} />,
    };
    const name = transformNamer.getApplicationName(parameter.property);
    parameters[name] = parameterDescriptor;
  }

  parameters["options"] = {
    refkey: getOperationOptionsParameterRefkey(operation),
    type: getOperationOptionsTypeRefkey(operation),
    optional: true,
  };

  return parameters;
}
