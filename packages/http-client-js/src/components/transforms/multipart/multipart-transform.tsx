import * as ay from "@alloy-js/core";
import { $ } from "@typespec/compiler/experimental/typekit";
import { useTransformNamePolicy } from "@typespec/emitter-framework";
import { HttpOperationMultipartBody } from "@typespec/http";
import { reportDiagnostic } from "../../../lib.js";
import { HttpPartTransform } from "./part-transform.jsx";

export interface MultipartTransformProps {
  body: HttpOperationMultipartBody;
}

export function MultipartTransform(props: MultipartTransformProps) {
  const transportNamer = useTransformNamePolicy();
  const httpParts = props.body.parts;

  if (httpParts.length === 0) {
    reportDiagnostic($.program, { code: "missing-http-parts", target: props.body.property });
    return <>[]</>;
  }

  const itemRef = transportNamer.getApplicationName(props.body.property);

  const partTransform = ay.mapJoin(
    httpParts,
    (part) => <HttpPartTransform part={part} itemRef={itemRef}/>,
    {
      joiner: ",\n",
    },
  );

  return <>[{partTransform}]</>;
}
