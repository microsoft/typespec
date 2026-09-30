# Java emitter code model

The TypeScript emitter converts the TCGC SDK model into the data contract consumed
by the Java generator. The interfaces, factories, and mutation helpers in
`src/common/` are owned by this emitter; they do not require the AutoRest codemodel
or codegen npm packages.

Model nodes are plain objects. Schema types use their existing `type` field for
narrowing, and response/parameter helpers use existing wire fields rather than
adding private discriminators. `common/schemas.ts` registers schemas in the
collections expected by Java and preserves the existing deduplication rules.

Keep object identity intact when modifying this code: recursive schemas, parent
clients, parameters, and properties can share references or form cycles. Factories
must also preserve metadata defaults, omitted fields, and container-copy behavior.
Do not replace these references with JSON clones.

The interchange format remains `code-model.yaml`, serialized as YAML 1.1 for the
Java backend's SnakeYAML reader. This is still the AutoRest-derived code-model
contract; removing the npm dependencies does not change the Java backend or the
external AutoRest flow.

`test/code-model.test.ts` covers model initialization, registration, reference
identity, signature filtering, plain-object graphs, and TypeSpec-to-YAML snapshots
captured before the dependency removal. Snapshot keys are sorted without cloning
away aliases, so mapping order does not obscure contract changes.
