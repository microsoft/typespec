# JSON Schema design decisions

## Extensions are an escape hatch

`@extension` adds arbitrary schema keywords. Guarding against misuse of this escape hatch is a non-goal. Users are responsible for the validity and semantics of extensions that override or conflict with emitter-generated keywords such as `type`, `anyOf`, or `$ref`.

Emitter changes may alter the generated schema structure while preserving the semantics of the TypeSpec types. They do not need to preserve the validation behavior of extensions that depend on replacing a particular generated keyword. For example, replacing `anyOf` through an extension does not require the emitter to retain an `anyOf` layer instead of compacting a union into a `type` array.

Defensive logic and regression tests solely to preserve behavior under such overrides are outside the emitter's scope. Ordinary custom keywords and vendor extensions must still be emitted correctly.
