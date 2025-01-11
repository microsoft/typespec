import * as ay from "@alloy-js/core";
import { Model } from "@typespec/compiler";
import { BodyPart } from "./body-part.jsx";

export interface MultipartTransformExpressionProps {
  type: Model;
  target: "application" | "transport";
}

export function MultipartTransformExpression(props: MultipartTransformExpressionProps) {
  return <>
  [{ay.mapJoin(props.type.properties.values(), (prop) => {
        return <BodyPart type={prop} target={props.target} />;
      }, {joiner: ",\n"})}]
      </>;
}
