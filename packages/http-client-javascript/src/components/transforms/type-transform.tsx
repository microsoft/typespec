import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Model } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import * as ef from "@typespec/emitter-framework/typescript";
import { isMultipart } from "../../utils/multipart.js";
import { MultipartTransformExpression } from "./multipart-transform-expression.jsx";

export function TypeTransformDeclaration(props: ef.TypeTransformProps) {
  if (isMultipart(props.type)) {
    return <MultipartTransformDeclaration target={props.target} type={props.type as Model} name={props.name} />;
  }

  return ef.TypeTransformDeclaration(props);
}

type MultipartTransformDeclarationProps = ef.TypeTransformProps & {
  type: Model;
};

export function MultipartTransformDeclaration(props: MultipartTransformDeclarationProps) {
  const namePolicy = ts.useTSNamePolicy();

  const baseName = namePolicy.getName(
    props.name ?? $.type.getPlausibleName(props.type),
    "function",
  );

  const functionSuffix = props.target === "application" ? "ToApplication" : "ToTransport";
  const functionName = props.name ? props.name : `${baseName}${functionSuffix}`;
  const itemType =
    props.target === "application" ? "any" : <ts.Reference refkey={ay.refkey(props.type)} />;

  return <ts.FunctionDeclaration
      export
      name={functionName}
      refkey={ef.getTypeTransformerRefkey(props.type, props.target)}
      parameters={{ item: itemType }}
      returnType="any"
    >
      return <MultipartTransformExpression type={props.type} target={props.target}  itemPath={["item"]} />;
    </ts.FunctionDeclaration>;
}
