using Reflection;

namespace TypeSpec.HttpClient;

model ClientDecoratorOptions {
  /**
   * The name of the client.
   * If not specified, the name will be derived from the namespace or interface name.
   */
  name?: string;

  ...EmitterScopeOptions;
}

model EmitterScopeOptions {
  /**
   * Specifies the target emitters that the decorator should apply to. If not set, the decorator will be applied to all emitters by default.
   */
  emitterScope?: string;
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

model ClientNameOptions {
  ...EmitterScopeOptions;
}

extern dec clientName(
  target: Namespace | Interface | Model | ModelProperty | Enum | EnumMember | Union | UnionVariant,
  name: valueof string,
  options?: valueof ClientNameOptions
);
