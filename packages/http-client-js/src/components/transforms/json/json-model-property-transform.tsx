import { Children, code, NamePolicyContext, Refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { ModelProperty } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { unpackProperty } from "../../utils/unpack-model-property.js";
import { ScalarDataTransform } from "../data-transform.jsx";
import { useTransformNamePolicy } from "../transform-name-policy.js";
import { JsonTransform } from "./json-transform.jsx";

export interface JsonModelPropertyTransformProps {
  itemRef: Refkey | Children;
  type: ModelProperty;
  target: "transport" | "application";
}

export function JsonModelPropertyTransform(props: JsonModelPropertyTransformProps) {
  const { $ } = useTsp();
  const transformNamer = useTransformNamePolicy();
  const propertyValueType = unpackProperty(props.type);

  const transportName = transformNamer.getTransportName(props.type);
  const applicationName = transformNamer.getApplicationName(props.type);
  const targetName = props.target === "transport" ? transportName : applicationName;
  const sourceName = props.target === "transport" ? applicationName : transportName;

  const propertyValueRef = props.itemRef ? code`${props.itemRef}.${sourceName}` : sourceName;
  let propertyValue: Children;

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
      <NamePolicyContext.Provider value={{ getName: (n) => n }}>
        <ts.ObjectProperty name={targetName} value={propertyValue} />
      </NamePolicyContext.Provider>
    );
  }

  return (
    <>
      <ts.ObjectProperty name={JSON.stringify(targetName)} value={propertyValue} />
    </>
  );
}
