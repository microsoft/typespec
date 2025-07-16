import { code } from "@alloy-js/core";
import { Children } from "@alloy-js/core/jsx-runtime";
import * as ts from "@alloy-js/typescript";
import { HttpOperationPart } from "@typespec/http";
import { HttpPartTransform } from "./part-transform.jsx";

export interface ArrayPartTransformProps {
  part: HttpOperationPart;
  itemRef: Children;
}

export function ArrayPartTransform(props: ArrayPartTransformProps) {
  const namePolicy = ts.useTSNamePolicy();
  const applicationName = namePolicy.getName(props.part.name!, "variable");
  const partElementName = applicationName;
  const mapCallbackSignature = <>({partElementName}: any)</>;
  const partItemRef = getPartRef(props.itemRef, applicationName);
  const inputExpression = props.part.optional ? (
    <>...({partItemRef} ?? [])</>
  ) : (
    <>...{partItemRef}</>
  );

  const partElement: HttpOperationPart = {
    ...props.part,
    multi: false,
    name: partElementName,
  };

  return (
    <>
      {inputExpression}.map({mapCallbackSignature}{" "}
      {code`=> (${(<HttpPartTransform itemRef={null} part={partElement} />)})`} )
    </>
  );
}

function getPartRef(itemRef: Children, partName: string) {
  if (itemRef === null) {
    return partName;
  }

  return code`${itemRef}.${partName}`;
}
