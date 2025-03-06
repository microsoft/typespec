import * as ts from "@alloy-js/typescript";
import { ModelProperty } from "@typespec/compiler";
import { useTransformNamePolicy } from "@typespec/emitter-framework";
import { uriTemplateLib } from "../external-packages/uri-template.js";

export interface UrlTemplateProps {
  template: string;
  parameters: ModelProperty[];
}

export function UrlTemplate(props: UrlTemplateProps) {
  const namer = useTransformNamePolicy();
  const params = props.parameters.map((p) => {
    return <ts.ObjectExpression>
      "{namer.getTransportName(p)}": {namer.getApplicationName(p)}
    </ts.ObjectExpression>;
  });
  return <ts.VarDeclaration name="url" type="string">
    {uriTemplateLib.parse}({JSON.stringify(props.template)}).expand({params})
  </ts.VarDeclaration>;
}
