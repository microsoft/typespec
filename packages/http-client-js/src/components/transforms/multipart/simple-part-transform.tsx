import { Children, code, List } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { HttpOperationPart } from "@typespec/http";
import { JsonTransform } from "../json/json-transform.jsx";

export interface SimplePartTransformProps {
  part: HttpOperationPart;
  itemRef: Children;
}

export function SimplePartTransform(props: SimplePartTransformProps) {
  const namePolicy = ts.useTSNamePolicy();
  const applicationName = namePolicy.getName(props.part.name!, "variable");
  const partName = ts.ValueExpression({ jsValue: props.part.name });
  const partRef = getPartRef(props.itemRef, applicationName);
  let bodyRef = code`${partRef}`;

  if (props.part.body.property) {
    bodyRef = code`${partRef}.${props.part.body.property.name}`;
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
