import { useTsp } from "#core/index.js";
import { buildParameterDescriptors } from "#python/utils/operation.js";
import { declarationRefkeys } from "#python/utils/refkey.js";
import * as py from "@alloy-js/python";
import type { Model, Operation } from "@typespec/compiler";
import { createDocElement } from "../../utils/doc.jsx";
import { TypeExpression } from "../type-expression/type-expression.jsx";

export interface FunctionDeclarationPropsWithType
  extends Omit<py.FunctionDeclarationProps, "name"> {
  type: Operation;
  name?: string;
  parametersMode?: "prepend" | "append" | "replace";
  parametersModel?: Model;
}

export type FunctionDeclarationProps =
  | FunctionDeclarationPropsWithType
  | py.FunctionDeclarationProps;

/**
 * A Python function declaration. Pass the `type` prop to create the
 * function declaration by converting from a TypeSpec Operation. Any other props
 * provided will take precedence.
 *
 * Behavior notes:
 * - `parametersModel`: When provided, it REPLACES the function parameters, ignoring
 *   `parameters` and `parametersMode`.
 * - Model-derived parameters include default values when present on the model, and
 *   emit `= None` for optional parameters without an explicit default.
 */
export function FunctionDeclaration(props: FunctionDeclarationProps) {
  const { $ } = useTsp();

  if (!isTypedFunctionDeclarationProps(props)) {
    return <py.FunctionDeclaration {...props} />;
  }

  const refkeys = declarationRefkeys(props.refkey, props.type);

  let name = props.name
    ? props.name
    : py.usePythonNamePolicy().getName(props.type.name, "function");

  const returnType = props.returnType ?? <TypeExpression type={props.type.returnType} />;
  let allParameters: py.ParameterDescriptor[] | undefined;
  if (props.parametersModel) {
    // When a parametersModel is provided, it always replaces parameters,
    // ignoring parametersMode and extra parameters.
    allParameters = buildParameterDescriptors(props.parametersModel) ?? [];
  } else {
    allParameters = buildParameterDescriptors(props.type.parameters, {
      params: props.parameters,
      mode: props.parametersMode,
    });
  }
  const rawDoc = props.doc ?? $.type.getDoc(props.type);
  const docElement = createDocElement(rawDoc, py.FunctionDoc);
  const doc = docElement ? (
    <>
      {docElement}
      <hbr />
    </>
  ) : undefined;

  return (
    <py.FunctionDeclaration
      doc={doc}
      refkey={refkeys}
      name={name}
      async={props.async}
      returnType={returnType}
      parameters={allParameters}
    >
      {props.children}
    </py.FunctionDeclaration>
  );
}

function isTypedFunctionDeclarationProps(
  props: FunctionDeclarationProps,
): props is FunctionDeclarationPropsWithType {
  return "type" in props;
}
