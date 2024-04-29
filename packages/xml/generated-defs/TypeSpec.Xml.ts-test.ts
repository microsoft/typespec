/** An error here would mean that the decorator is not exported or doesn't have the right name. */
import { $attribute, $name, $ns, $nsDeclarations, $unwrapped } from "@typespec/xml";
import type {
  AttributeDecorator,
  NameDecorator,
  NsDeclarationsDecorator,
  NsDecorator,
  UnwrappedDecorator,
} from "./TypeSpec.Xml.js";

type Decorators = {
  $name: NameDecorator;
  $attribute: AttributeDecorator;
  $unwrapped: UnwrappedDecorator;
  $ns: NsDecorator;
  $nsDeclarations: NsDeclarationsDecorator;
};

/** An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ... */
const _: Decorators = {
  $name,
  $attribute,
  $unwrapped,
  $ns,
  $nsDeclarations,
};
