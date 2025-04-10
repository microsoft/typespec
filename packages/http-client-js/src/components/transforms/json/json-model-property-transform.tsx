import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { ModelProperty } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { unpackProperty } from "../../utils/unpack-model-property.js";
import { ScalarDataTransform } from "../data-transform.jsx";
import { useTransformNamePolicy } from "../transform-name-policy.js";
import { JsonTransform } from "./json-transform.jsx";

export interface JsonModelPropertyTransformProps {
  itemRef: ay.Refkey | ay.Children;
  type: ModelProperty;
  target: "transport" | "application";
}

export function JsonModelPropertyTransform(props: JsonModelPropertyTransformProps) {
  const transformNamer = useTransformNamePolicy();
  const propertyValueType = unpackProperty(props.type);

  const transportName = transformNamer.getTransportName(props.type);
  const applicationName = transformNamer.getApplicationName(props.type);
  const targetName = props.target === "transport" ? transportName : applicationName;
  const sourceName = props.target === "transport" ? applicationName : transportName;

  const propertyValueRef = props.itemRef ? ay.code`${props.itemRef}.${sourceName}` : sourceName;
  let propertyValue: ay.Children;

  if ($.scalar.is(propertyValueType)) {
    propertyValue = (
      <ScalarDataTransform type={props.type} target={props.target} itemRef={propertyValueRef} />
    );
  } else {
    propertyValue = (
      <JsonTransform type={propertyValueType} target={props.target} itemRef={propertyValueRef} />
    );
  }

  if (props.target === "transport") {
    return (
      <ay.NamePolicyContext.Provider value={{ getName: (n) => n }}>
        <ts.ObjectProperty name={targetName} value={propertyValue} />
      </ay.NamePolicyContext.Provider>
    );
  }

  return (
    <>
      <ts.ObjectProperty name={JSON.stringify(targetName)} value={propertyValue} />
    </>
  );
}
