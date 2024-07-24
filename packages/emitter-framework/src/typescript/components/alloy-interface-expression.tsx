import { Children, Indent } from "@alloy-js/core";


export interface InterfaceExpressionProps {
  children?: Children;
}

export function InterfaceExpression(props: InterfaceExpressionProps) {
  return ["{\n", <Indent>{props.children}</Indent>, "\n}"];
}
