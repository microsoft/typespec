import { useTsp } from "#core/index.js";
import { buildParameterDescriptors } from "#python/utils/operation.js";
import { declarationRefkeys } from "#python/utils/refkey.js";
import { type Children, List } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import type { Model, Operation } from "@typespec/compiler";
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
 * Normalize various doc sources into a Python FunctionDoc element.
 *
 * Accepts:
 * - string → split into lines and render as a multi-line docstring
 * - string[] | Children[] → rendered as separate paragraphs
 * - Children (e.g., an explicit <py.FunctionDoc />) → returned as-is
 */
function createDocElement(
  $: ReturnType<typeof useTsp>["$"],
  source?: string | string[] | Children | Children[],
): Children | undefined {
  if (!source) return undefined;
  if (Array.isArray(source)) {
    return <py.FunctionDoc description={source as Children[]} />;
  } else if (typeof source === "string") {
    const lines = source.split(/\r?\n/);
    return (
      <py.FunctionDoc
        description={[
          <List hardline>
            {lines.map((line) => (
              <>{line}</>
            ))}
          </List>,
        ]}
      />
    );
  } else {
    return source as Children | undefined;
  }
}

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
  const docElement = createDocElement($, rawDoc);
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
