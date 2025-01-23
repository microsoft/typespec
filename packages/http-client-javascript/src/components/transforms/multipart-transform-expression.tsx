import * as ay from "@alloy-js/core";
import { Model } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import * as ef from "@typespec/emitter-framework/typescript";
import { reportDiagnostic } from "../../lib.js";
import { BodyPart } from "./body-part.jsx";

export function MultipartTransformExpression(props: ef.TypeTransformProps) {
  if (!$.model.is(props.type)) {
    reportDiagnostic($.program, {
      code: "non-model-parts",
      target: props.type,
    });
  }
  const partsModel = props.type as Model;
  const { type, ...transformProps } = props;
  return <>
  [{ay.mapJoin(partsModel.properties.values(), (part) => {
        return <BodyPart type={part} {...transformProps} />;
      }, {joiner: ",\n"})}]
      </>;
}
