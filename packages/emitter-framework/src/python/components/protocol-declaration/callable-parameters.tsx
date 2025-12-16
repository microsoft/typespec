import { TypeExpression } from "#python/components/type-expression/type-expression.js";
import * as py from "@alloy-js/python";
import type { Operation } from "@typespec/compiler";
import { useTsp } from "../../../core/context/tsp-context.js";

export interface CallableParametersProps {
  /**
   * The operation to extract parameters from.
   */
  type: Operation;
}

/**
 * Builds parameter descriptors for a callable (method/function) from an Operation's parameters.
 *
 * Iterates over the operation's parameters model and creates ParameterDescriptor objects
 * with name, type expression, and default value (None for optional parameters).
 *
 * @returns Array of ParameterDescriptor objects for use with py.MethodDeclaration or similar.
 *
 * @example
 * ```tsx
 * const params = CallableParameters({ type: operation });
 * <py.MethodDeclaration name="foo" parameters={params} />
 * ```
 */
export function CallableParameters(props: CallableParametersProps): py.ParameterDescriptor[] {
  const { $ } = useTsp();
  const paramsModel = props.type.parameters;

  if (!paramsModel) {
    return [];
  }

  const parameters: py.ParameterDescriptor[] = [];

  try {
    for (const prop of $.model.getProperties(paramsModel).values()) {
      parameters.push({
        name: prop.name,
        type: <TypeExpression type={prop.type} />,
        // Optional parameters without explicit defaults get `= None`
        ...(prop.optional ? { default: <>None</> } : {}),
      });
    }
  } catch {
    // If getProperties fails, return empty array
  }

  return parameters;
}
