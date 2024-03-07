/** An error here would mean that the decorator is not exported or doesn't have the right name. */
import { $oneOf, $useRef } from "@typespec/openapi3";
import { OneOfDecorator, UseRefDecorator } from "./decorators.js";

type Decorators = {
  $oneOf: OneOfDecorator;
  $useRef: UseRefDecorator;
};

/** An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ... */
const _: Decorators = {
  $oneOf,
  $useRef,
};
