import { type Children } from "@alloy-js/core";
import type { Model } from "@typespec/compiler";
import { JsonTransform } from "./json-transform.jsx";

export interface JsonModelBaseTransformProps {
  itemRef: Children;
  type: Model;
  target: "transport" | "application";
}

export function JsonModelBaseTransform(props: JsonModelBaseTransformProps) {
  const baseModel = props.type.baseModel;

  if (!baseModel) {
    return null;
  }

  return (
    <>
      ...
      <JsonTransform {...props} type={baseModel} />,
    </>
  );
}
