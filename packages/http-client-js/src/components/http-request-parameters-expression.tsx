import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { $ } from "@typespec/compiler/experimental/typekit";
import { useTransformNamePolicy } from "@typespec/emitter-framework";
import { HttpOperation, HttpProperty } from "@typespec/http";
import { getDefaultValue } from "../utils/parameters.jsx";
import { JsonTransform } from "./transforms/json/json-transform.jsx";
export interface HttpRequestParametersExpressionProps {
  httpOperation: HttpOperation;
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
        const paramItemRef: ay.Children = $.httpOperation.resolveParameterAccess(
          props.httpOperation,
          httpProperty,
        );

        if (defaultValue) {
          const defaultAssignment = defaultValue ? ` ?? ${defaultValue}` : "";
          const headerValue = (
            <>
              {paramItemRef}
              {defaultAssignment}
            </>
          );
          const name = transformNamer.getTransportName(parameter);
          const paramAssignment = <ts.ObjectProperty name={`"${name}"`} value={headerValue} />;
          return paramAssignment;
        }

        // Removes the last part of the parameter name
        const itemRef: ay.Children = paramItemRef.split(".").slice(0, -1).join(".");
        if (parameter.optional) {
          return ay.code`
        ...(${paramItemRef} && {${(<JsonTransform itemRef={itemRef} type={parameter} target="transport" />)}})
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
