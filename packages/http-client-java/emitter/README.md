# Java emitter code model

The emitter builds `code-model.yaml` for the Java generator using locally owned
classes in `src/common/codemodel.ts`. This module contains the model subset used
by the TypeSpec flow, adapted from `@autorest/codemodel` 4.20.1 with its property
documentation and constructor behavior retained. The initializer and media-type
helpers come from the corresponding `@azure-tools/codegen` 2.10.1 subset.

Existing emitter models continue to extend these classes. Keep constructor
defaults, recursive references, and `instanceof` identity intact. In particular,
the Java-specific choice and constant classes are intentionally distinct from the
base model classes used by schema registration; combining them changes
deduplication behavior.

The Java backend and YAML 1.1 interchange format are unchanged. Source tracking
was disabled at the sole TypeSpec construction site and is not included in this
local subset.

`test/code-model.test.ts` covers class identity, initialization, registration,
shared references, and the same pre-removal YAML snapshots used to evaluate the
interface/factory alternative.
