import { Children, mapJoin } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Model, ModelProperty } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";

export interface HttpRequestParametersExpressionProps {
  parameters?: Model;
  children?: Children;
}

export function HttpRequestParametersExpression(props: HttpRequestParametersExpressionProps) {
  const namingPolicy = ts.useTSNamePolicy();
  const parameters: (ModelProperty | Children)[] = [];

  if(props.children || (Array.isArray(props.children) && props.children.length) ) { 
    parameters.push(<>
      {props.children},

    </>);
  }

  if(!props.parameters && parameters.length) { 
    return <ts.ObjectExpression>
      {parameters}
    </ts.ObjectExpression>;
  } else if(!props.parameters) {
    return <ts.ObjectExpression />;
  }

  const members = mapJoin(props.parameters.properties, (parameterName, parameter) => {
    const options = $.modelProperty.getHttpParamOptions(parameter);
    const name = options?.name ? options.name : parameter.name;
    const applicationName = namingPolicy.getName(parameter.name, "parameter");
    const parameterPath = parameter.optional
      ? `options.${applicationName}`
      : applicationName;
    return <ts.ObjectProperty name={JSON.stringify(name)} value={parameterPath} />;
  }, {joiner: ",\n"});

  parameters.push(...members)

  return <ts.ObjectExpression>
    {parameters}
  </ts.ObjectExpression>;
}
