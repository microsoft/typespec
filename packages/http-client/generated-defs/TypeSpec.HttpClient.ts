import type { DecoratorContext, Interface, Namespace } from "@typespec/compiler";

export interface ClientDecoratorOptions {
  readonly name?: string;
}

/**
 * Create a TypeSpec.HttpClient.Client client out of a namespace or interface
 *
 * @example
 * ```typespec
 * @client
 * namespace MyService {}
 * ```
 * @example
 * ```typespec
 * @client
 * interface MyService {}
 * ```
 */
export type ClientDecorator = (
  context: DecoratorContext,
  target: Namespace | Interface,
  options?: ClientDecoratorOptions,
) => void;

export type TypeSpecHttpClientDecorators = {
  client: ClientDecorator;
};
