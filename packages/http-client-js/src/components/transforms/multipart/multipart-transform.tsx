import { For } from "@alloy-js/core";
import { useTransformNamePolicy, useTsp } from "@typespec/emitter-framework";
import { HttpOperationMultipartBody } from "@typespec/http";
import { reportDiagnostic } from "../../../lib.js";
import { HttpPartTransform } from "./part-transform.jsx";

export interface MultipartTransformProps {
  body: HttpOperationMultipartBody;
}

export function MultipartTransform(props: MultipartTransformProps) {
  const { $ } = useTsp();
  const transportNamer = useTransformNamePolicy();
  const httpParts = props.body.parts;

  if (httpParts.length === 0) {
    reportDiagnostic($.program, { code: "missing-http-parts", target: props.body.property });
    return <>[]</>;
  }

  const itemRef = transportNamer.getApplicationName(props.body.property);

  const partTransform = (
    <For each={httpParts} comma line>
      {(part, _) => <HttpPartTransform part={part} itemRef={itemRef} />}
    </For>
  );

  return <>[{partTransform}]</>;
}
