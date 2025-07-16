import { Children, code } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { HttpOperationPart } from "@typespec/http";
import { getCreateFilePartDescriptorReference } from "../../static-helpers/multipart-helpers.jsx";

export interface FilePartTransformProps {
  part: HttpOperationPart;
  itemRef: Children;
}

export function FilePartTransform(props: FilePartTransformProps) {
  const namePolicy = ts.useTSNamePolicy();
  const defaultContentType = getContentType(props.part);
  const applicationName = namePolicy.getName(props.part.name!, "variable");
  const itemRef = getPartRef(props.itemRef, applicationName);
  const args: Children = [JSON.stringify(props.part.name), itemRef];
  if (defaultContentType) {
    args.push(ts.ValueExpression({ jsValue: defaultContentType }));
  }
  return <ts.FunctionCallExpression target={getCreateFilePartDescriptorReference()} args={args} />;
}

function getContentType(part: HttpOperationPart) {
  const contentTypes = part.body.contentTypes;
  if (contentTypes.length !== 1) {
    return undefined;
  }

  const contentType = contentTypes[0];

  if (!contentType || contentType === "*/*") {
    return undefined;
  }

  return contentType;
}

function getPartRef(itemRef: Children, partName: string) {
  if (itemRef === null) {
    return partName;
  }

  return code`${itemRef}.${partName}`;
}
