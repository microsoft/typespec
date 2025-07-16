import { Children, code, List } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { useTsp } from "@typespec/emitter-framework";
import { HttpOperationPart } from "@typespec/http";
import { reportDiagnostic } from "../../../lib.js";
import { JsonTransform } from "../json/json-transform.jsx";

export interface SimplePartTransformProps {
  part: HttpOperationPart;
  itemRef: Children;
}

export function SimplePartTransform(props: SimplePartTransformProps) {
  const { $ } = useTsp();
  const namePolicy = ts.useTSNamePolicy();
  const applicationName = namePolicy.getName(props.part.name!, "variable");
  const partName = ts.ValueExpression({ jsValue: props.part.name });
  const partContentType = props.part.body.contentTypes[0] ?? "application/json";
  const partRef = getPartRef(props.itemRef, applicationName);
  let bodyRef = code`${partRef}`;

  if (props.part.body.property) {
    bodyRef = code`${partRef}.${props.part.body.property.name}`;
  }

  if (!partContentType.startsWith("application/json")) {
    reportDiagnostic($.program, {
      code: "unsupported-content-type",
      target: props.part.body.type,
      message: `Unsupported content type: ${partContentType}`,
    });
  }

  return (
    <ts.ObjectExpression>
      <List comma line>
        <ts.ObjectProperty name="name" jsValue={partName} />
        <ts.ObjectProperty
          name="body"
          value={<JsonTransform itemRef={bodyRef} target="transport" type={props.part.body.type} />}
        />
      </List>
    </ts.ObjectExpression>
  );
}

function getPartRef(itemRef: Children, partName: string) {
  if (itemRef === null) {
    return partName;
  }

  return code`${itemRef}.${partName}`;
}
