namespace TypeSpec.HttpClient;

/**
 * Specifies the target emitters that the decorator should apply. If not set, the decorator will be applied to all emitters by default.
 * You can use ”!” to exclude specific emitters, for example: `!@typespec/http-client-js, !@typespec/http-client-csharp`
 */
model ClientDecoratorOptions {
  emitterScope?: string;
}
