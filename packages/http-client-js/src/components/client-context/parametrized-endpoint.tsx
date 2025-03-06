import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { ModelProperty } from "@typespec/compiler";
import { useTransformNamePolicy } from "@typespec/emitter-framework";
import { getDefaultValue } from "../../utils/parameters.jsx";

export interface ParametrizedEndpointProps {
  refkey: ay.Refkey;
  template: string;
  params: ModelProperty[];
}

export function ParametrizedEndpoint(props: ParametrizedEndpointProps) {
  const propNamer = useTransformNamePolicy();
  const paramsRef = ay.refkey();
  const params =
    <ts.VarDeclaration name="params" type={"Record<string, any>"} refkey={paramsRef}>
    <ts.ObjectExpression>
      {ay.mapJoin(props.params, (p) => {
        const applicationName = propNamer.getApplicationName(p);
        const transportName = propNamer.getTransportName(p);
        const defaultValue = p.defaultValue ? ` ?? ${getDefaultValue(p)}` : "";
        const itemRef = p.optional ? `options?.${applicationName}${defaultValue}` : applicationName;
        return <ts.ObjectProperty name={transportName} value={itemRef}/>
      }, {joiner: ",\n"})}
    </ts.ObjectExpression>
  </ts.VarDeclaration>;

  const resolvedEndpoint =
    <ts.VarDeclaration name="resolvedEndpoint" refkey={props.refkey}>
    {ay.code`
      "${props.template}".replace(/{([^}]+)}/g, (_, key) =>
        key in ${paramsRef} ? String(params[key]) : (() => { throw new Error(\`Missing parameter: $\{key}\`); })()
      );
    `}
  </ts.VarDeclaration>;

  return [params, resolvedEndpoint];
}
