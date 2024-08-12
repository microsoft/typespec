import type { TypeSpecXmlDecorators } from "../generated-defs/TypeSpec.Xml.js";
import { $attribute, $name, $ns, $nsDeclarations, $unwrapped } from "./decorators.js";

export { $lib } from "./lib.js";

/** @internal */
export const $decorators = {
  "TypeSpec.Xml": {
    attribute: $attribute,
    name: $name,
    ns: $ns,
    nsDeclarations: $nsDeclarations,
    unwrapped: $unwrapped,
  } satisfies TypeSpecXmlDecorators,
};
