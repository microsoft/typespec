import { Children, mapJoin } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Model, ModelProperty } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { ModelSerializers } from "./serializers.jsx";

export interface HttpRequestParametersExpressionProps {
  parameters?: Model;
  children?: Children;
}

export function HttpRequestParametersExpression(props: HttpRequestParametersExpressionProps) {
  const namingPolicy = ts.useTSNamePolicy();
  const parameters: (ModelProperty | Children)[] = [];

  if (props.children || (Array.isArray(props.children) && props.children.length)) {
    parameters.push(<>
      {props.children},

    </>);
  }

  if (!props.parameters && parameters.length) {
    return <ts.ObjectExpression>
      {parameters}
    </ts.ObjectExpression>;
  } else if (!props.parameters) {
    return <ts.ObjectExpression />;
  }

  const members = mapJoin(
    props.parameters.properties,
    (_parameterName, parameter) => {
      const options = $.modelProperty.getHttpParamOptions(parameter);
      const name = options?.name ? options.name : parameter.name;
      const applicationName = namingPolicy.getName(parameter.name, "parameter");
      const parameterPath = parameter.optional ? `options?.${applicationName}` : applicationName;
      let value = parameterPath;

      if(isConstantHeader(parameter)) {
        value = <ts.ValueExpression jsValue={(parameter.type as any).value}  /> 
      }
      return <ts.ObjectProperty name={JSON.stringify(name)} value={value} />;
    },
    { joiner: ",\n" },
  );

  parameters.push(...members);

  return <ts.ObjectExpression>
    {parameters}
  </ts.ObjectExpression>;
}


function isConstantHeader(modelProperty: ModelProperty) {
  if (!$.modelProperty.isHttpHeader(modelProperty)) {
    return false;
  }

  if ("value" in modelProperty.type && modelProperty.type.value !== undefined) {
    return true;
  }

  return false;
}
