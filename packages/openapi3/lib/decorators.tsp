import "../dist/src/index.js";

namespace TypeSpec.OpenAPI;

using TypeSpec.Reflection;

/**
 * Specify that `oneOf` should be used instead of `anyOf` for that union.
 */
extern dec oneOf(target: Union | ModelProperty);
/**
 * Specify an external reference that should be used inside of emitting this type.
 * @param ref External reference(e.g. "../../common.json#/components/schemas/Foo")
 */
extern dec useRef(target: Model | ModelProperty, ref: valueof string);

/**
 * Specify the `title` field of the schema emitted for this type.
 *
 * @param title The `title` to use in the schema
 */
extern dec title(
  target:
    | Reflection.Enum
    | Reflection.Model
    | Reflection.ModelProperty
    | Reflection.Scalar
    | Reflection.Union,
  title: valueof string
);
