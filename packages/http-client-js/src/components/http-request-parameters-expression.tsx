import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { useTransformNamePolicy } from "@typespec/emitter-framework";
import { HttpProperty } from "@typespec/http";
import { getDefaultValue } from "../utils/parameters.jsx";
import { JsonTransform } from "./transforms/json/json-transform.jsx";
export interface HttpRequestParametersExpressionProps {
  optionsParameter: ay.Children;
  parameters?: HttpProperty[];
  children?: ay.Children;
}

export function HttpRequestParametersExpression(props: HttpRequestParametersExpressionProps) {
  const parameters: ay.Children[] = [];
  const transformNamer = useTransformNamePolicy();

  if (props.children || (Array.isArray(props.children) && props.children.length)) {
    parameters.push(<>{props.children},</>);
  }

  if (!props.parameters && parameters.length) {
    return <ts.ObjectExpression>{parameters}</ts.ObjectExpression>;
  } else if (!props.parameters) {
    return <ts.ObjectExpression />;
  }

  const optionsParamRef = props.optionsParameter ?? "options";
  const members = (
    <ay.For each={props.parameters} line comma>
      {(httpProperty) => {
        const parameter = httpProperty.property;

        const defaultValue = getDefaultValue(httpProperty);
        const paramItemRef: ay.Children = transformNamer.getApplicationName(parameter);

        const paramRef = ay.code`${optionsParamRef}?.${paramItemRef}`;

        if (defaultValue) {
          const defaultAssignment = defaultValue ? ` ?? ${defaultValue}` : "";
          const headerValue = (
            <>
              {paramRef}
              {defaultAssignment}
            </>
          );
          const name = transformNamer.getTransportName(parameter);
          const paramAssignment = <ts.ObjectProperty name={`"${name}"`} value={headerValue} />;
          return paramAssignment;
        }

        const itemRef: ay.Children = parameter.optional ? ay.code`${optionsParamRef}?` : null;
        if (parameter.optional) {
          return ay.code`
        ...(${paramRef} && {${(<JsonTransform itemRef={itemRef} type={parameter} target="transport" />)}})
      `;
        } else {
          return <JsonTransform itemRef={itemRef} type={parameter} target="transport" />;
        }
      }}
    </ay.For>
  );

  parameters.push(members);

  return <ts.ObjectExpression>{parameters}</ts.ObjectExpression>;
}
