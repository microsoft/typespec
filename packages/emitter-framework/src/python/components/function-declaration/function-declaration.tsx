import { useTsp } from "#core/index.js";
import { buildParameterDescriptors } from "#python/utils/operation.js";
import { declarationRefkeys } from "#python/utils/refkey.js";
import * as py from "@alloy-js/python";
import type { Model, Operation } from "@typespec/compiler";
import { DocElement } from "../doc-element/doc-element.js";
import { TypeExpression } from "../type-expression/type-expression.js";

/** Operation-backed function options with explicit signature and documentation overrides. */
export interface FunctionDeclarationPropsWithType extends Omit<
  py.FunctionDeclarationProps,
  "name"
> {
  /** Operation supplying parameters, documentation, and the unfiltered return type. */
  type: Operation;
  /** Name override; otherwise the operation name uses the Python function naming policy. */
  name?: string;
  /** Alternative parameter model; replaces operation parameters and ignores explicit `parameters`. */
  parametersModel?: Model;
  /** If true, parameters replaces operation parameters instead of adding to them as keyword-only */
  replaceParameters?: boolean;
}

/** Selects an operation-derived function or an ordinary manually specified Alloy function. */
export type FunctionDeclarationProps =
  FunctionDeclarationPropsWithType | py.FunctionDeclarationProps;

/**
 * A Python function declaration. Pass the `type` prop to create the
 * function declaration by converting from a TypeSpec Operation. Any other props
 * provided will take precedence.
 *
 * @remarks
 * - `parametersModel`: When provided, it replaces the function parameters, ignoring
 *   the `parameters` option.
 * - Model-derived parameters include default values when present on the model, and
 *   emit `= None` for optional parameters without an explicit default.
 * - Additional parameters are keyword-only when operation parameters exist; without
 *   operation parameters, additional parameters without defaults remain positional.
 */
export function FunctionDeclaration(props: FunctionDeclarationProps) {
  const { $ } = useTsp();

  if (!isTypedFunctionDeclarationProps(props)) {
    return <py.FunctionDeclaration {...props} />;
  }

  const refkeys = declarationRefkeys(props.refkey, props.type);

  const name = props.name
    ? props.name
    : py.usePythonNamePolicy().getName(props.type.name, "function");

  const returnType = props.returnType ?? <TypeExpression type={props.type.returnType} />;
  let allParameters: (py.ParameterDescriptor | string)[] | undefined;
  if (props.parametersModel) {
    // When a parametersModel is provided, it always replaces parameters,
    // ignoring extra parameters.
    allParameters = buildParameterDescriptors(props.parametersModel) ?? [];
  } else {
    allParameters = buildParameterDescriptors(props.type.parameters, {
      params: props.parameters,
      replaceParameters: props.replaceParameters,
    });
  }
  const docSource = props.doc ?? $.type.getDoc(props.type);
  const docElement = docSource ? (
    <DocElement doc={docSource} component={py.FunctionDoc} />
  ) : undefined;
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
