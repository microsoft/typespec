import * as ef from "@typespec/emitter-framework/typescript";
import { isMultipart } from "../../utils/multipart.js";
import { MultipartTransformExpression } from "./multipart-transform-expression.jsx";

export function TypeTransformCall(props: ef.TypeTransformCallProps) {
  if (isMultipart(props.type)) {
    return <MultipartTransformExpression {...props} />;
  }

  return <ef.TypeTransformCall {...props} />;
}
