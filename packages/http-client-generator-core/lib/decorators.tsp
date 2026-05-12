using Reflection;

namespace TypeSpec.ClientGenerator.Core;

/**
 * Overrides the generated name for client SDK elements including clients, methods, parameters,
 * unions, models, enums, and model properties.
 *
 * @param target The type you want to rename.
 * @param rename The rename you want applied to the object.
 * @param scope Specifies the target language emitters that the decorator should apply.
 */
extern dec clientName(target: unknown, rename: valueof string, scope?: valueof string);

/**
 * Marks a namespace, interface, or operation as a client boundary.
 *
 * @param target The namespace, interface, or operation to mark as a client.
 * @param value Optional client configuration options.
 * @param scope Specifies the target language emitters that the decorator should apply.
 */
extern dec client(target: Namespace | Interface, value?: {}, scope?: valueof string);

/**
 * Sets the access level (public or internal) for a type.
 *
 * @param target The model, enum, operation, or union to set access for.
 * @param value The access level: "public" or "internal".
 * @param scope Specifies the target language emitters that the decorator should apply.
 */
extern dec access(
  target: Model | Enum | Operation | Union,
  value: valueof "public" | "internal",
  scope?: valueof string,
);

/**
 * Sets usage flags for a model.
 *
 * @param target The model or enum to set usage for.
 * @param value The usage flags value.
 * @param scope Specifies the target language emitters that the decorator should apply.
 */
extern dec usage(target: Model | Enum | Union, value: valueof EnumMember, scope?: valueof string);

/**
 * Indicates whether the generate protocol method for the target operation.
 *
 * @param target The operation to configure.
 * @param value Whether to generate a protocol API method. Default is `true`.
 * @param scope Specifies the target language emitters that the decorator should apply.
 */
extern dec protocolAPI(target: Operation, value?: valueof boolean, scope?: valueof string);

/**
 * Indicates whether the generate convenient method for the target operation.
 *
 * @param target The operation to configure.
 * @param value Whether to generate a convenient API method. Default is `true`.
 * @param scope Specifies the target language emitters that the decorator should apply.
 */
extern dec convenientAPI(target: Operation, value?: valueof boolean, scope?: valueof string);

/**
 * Sets the client namespace for the target type.
 *
 * @param target The type to set the client namespace for.
 * @param value The namespace value.
 * @param scope Specifies the target language emitters that the decorator should apply.
 */
extern dec clientNamespace(target: unknown, value?: valueof string, scope?: valueof string);
