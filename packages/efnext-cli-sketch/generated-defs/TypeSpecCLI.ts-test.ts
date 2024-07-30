/** An error here would mean that the decorator is not exported or doesn't have the right name. */
import { $cli, $invertable, $positional, $short } from "@typespec/efnext-cli-sketch";
import type {
  CliDecorator,
  InvertableDecorator,
  PositionalDecorator,
  ShortDecorator,
} from "./TypeSpecCLI.js";

type Decorators = {
  $short: ShortDecorator;
  $positional: PositionalDecorator;
  $invertable: InvertableDecorator;
  $cli: CliDecorator;
};

/** An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ... */
const _: Decorators = {
  $short,
  $positional,
  $invertable,
  $cli,
};
