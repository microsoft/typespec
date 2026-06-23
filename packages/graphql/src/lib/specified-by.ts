import {
  type DecoratorContext,
  type DecoratorFunction,
  type Program,
  type Scalar,
  validateDecoratorUniqueOnNode,
} from "@typespec/compiler";
import { useStateMap } from "@typespec/compiler/utils";
import { GraphQLKeys } from "../lib.js";

const [getSpecifiedByUrl, setSpecifiedByUrl] = useStateMap<Scalar, string>(GraphQLKeys.specifiedBy);

export { getSpecifiedByUrl, setSpecifiedByUrl };

/**
 * Get the @specifiedBy URL for a scalar, if one has been set.
 */
export function getSpecifiedBy(program: Program, scalar: Scalar): string | undefined {
  return getSpecifiedByUrl(program, scalar);
}

export const $specifiedBy: DecoratorFunction = (
  context: DecoratorContext,
  target: Scalar,
  url: string,
) => {
  validateDecoratorUniqueOnNode(context, target, $specifiedBy);
  setSpecifiedByUrl(context.program, target, url);
};
