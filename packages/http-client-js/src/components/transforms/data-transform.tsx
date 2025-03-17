import { Children, Refkey } from "@alloy-js/core";
import { EncodeData, ModelProperty, Scalar } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { reportDiagnostic } from "../../lib.js";
import { unpackProperty } from "../utils/unpack-model-property.js";
import { getScalarTransformer } from "./scalar-transform.jsx";

export interface ScalarDataTransformProps {
  itemRef: Refkey | Children;
  type: Scalar | ModelProperty;
  target: "transport" | "application";
}

export function ScalarDataTransform(props: ScalarDataTransformProps) {
  let scalar: Scalar;
  let encoding: EncodeData | undefined;
  if ($.modelProperty.is(props.type)) {
    const valueType = unpackProperty(props.type);
    if (!$.scalar.is(valueType)) {
      reportDiagnostic($.program, {
        code: "unexpected-non-scalar-type",
        target: props.type,
      });
      return null;
    }
    scalar = valueType;
    encoding = $.modelProperty.getEncoding(props.type);
  } else {
    scalar = props.type;
    encoding = $.scalar.getEncoding(scalar);
  }
  // const encoding = $.scalar.getEncoding(scalar);

  const { toApplication, toTransport } = getScalarTransformer(scalar);

  return props.target === "transport"
    ? toTransport(props.itemRef, encoding)
    : toApplication(props.itemRef, encoding);
}
