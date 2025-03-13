/**
 * Private decorators. Those are meant for internal use inside Http types only.
 */
namespace TypeSpec.Http.Private;

extern dec plainData(target: TypeSpec.Reflection.Model);
extern dec httpFile(target: TypeSpec.Reflection.Model);
extern dec httpPart(
  target: TypeSpec.Reflection.Model,
  type: unknown,
  options: valueof HttpPartOptions
);

/**
 * Specify if inapplicable metadata should be included in the payload for the given entity.
 * @param value If true, inapplicable metadata will be included in the payload.
 */
extern dec includeInapplicableMetadataInPayload(target: unknown, value: valueof boolean);
