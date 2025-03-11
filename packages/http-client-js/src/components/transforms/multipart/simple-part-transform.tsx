import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { $ } from "@typespec/compiler/experimental/typekit";
import { HttpOperationPart } from "@typespec/http";
import { reportDiagnostic } from "../../../lib.js";
import { JsonTransform } from "../json/json-transform.jsx";

export interface SimplePartTransformProps {
  part: HttpOperationPart;
  itemRef: ay.Children;
}

export function SimplePartTransform(props: SimplePartTransformProps) {
  const namePolicy = ts.useTSNamePolicy();
  const applicationName = namePolicy.getName(props.part.name!, "variable");
  const partName = ts.ValueExpression({ jsValue: props.part.name });
  const partContentType = props.part.body.contentTypes[0] ?? "application/json";
  const partRef = getPartRef(props.itemRef, applicationName);

  if (!partContentType.startsWith("application/json")) {
    reportDiagnostic($.program, {
      code: "unsupported-content-type",
      target: props.part.body.type,
      message: `Unsupported content type: ${partContentType}`,
    });
  }

  return (
    <ts.ObjectExpression>
      <ts.ObjectProperty name="name" jsValue={partName} />,
      <ts.ObjectProperty
        name="body"
        value={<JsonTransform itemRef={partRef} target="transport" type={props.part.body.type} />}
      />
      ,
    </ts.ObjectExpression>
  );
}

function getPartRef(itemRef: ay.Children, partName: string) {
  if (itemRef === null) {
    return partName;
  }

  return ay.code`${itemRef}.${partName}`;
}
