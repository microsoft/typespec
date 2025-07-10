using Reflection;

namespace TypeSpec.HttpClient;

model ClientDecoratorOptions {
  /**
   * The name of the client.
   * If not specified, the name will be derived from the namespace or interface name.
   */
  name?: string;
}

/**
 * Create a TypeSpec.HttpClient.Client client out of a namespace or interface
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
extern dec client(target: Namespace | Interface, options?: valueof ClientDecoratorOptions);

extern dec clientLocation(source: Operation, target: Namespace | Interface);
