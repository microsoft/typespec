import { Children, mapJoin } from "@alloy-js/core";
import { HttpProperty } from "@typespec/http";
import * as ts from "@alloy-js/typescript";

export interface HttpRequestParametersExpressionProps {
  parameters: HttpProperty[];
  children?: Children;
}

export function HttpRequestParametersExpression(props: HttpRequestParametersExpressionProps) {
  const namingPolicy = ts.useTSNamePolicy();
  const parameters: (HttpProperty | Children)[] = props.parameters;

  if(props.children || (Array.isArray(props.children) && props.children.length) ) { 
    parameters.unshift(props.children);
  }

  const members = mapJoin(props.parameters, (parameter) => {
    if(!isHttpProperty(parameter)) {
      return parameter;
    }
    const name = "options" in parameter ? parameter.options.name : parameter.property.name;
    const applicationName = namingPolicy.getName(parameter.property.name, "parameter");
    const parameterPath = parameter.property.optional
      ? `options.${applicationName}`
      : applicationName;
    return <ts.ObjectProperty name={JSON.stringify(name)} value={parameterPath} />;
  }, {joiner: ",\n"});


  if(members.length === 0) {
    return <ts.ObjectExpression />;
  }

  return <ts.ObjectExpression>
    {members}
  </ts.ObjectExpression>;
}

function isHttpProperty(property: any): property is HttpProperty {
  return "kind" in property && property.kind;
}
