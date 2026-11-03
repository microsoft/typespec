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
captured before the dependency removal, including LRO, subclient, multipart, and
XML-bytes scenarios. Snapshot keys are sorted without cloning away aliases, so
mapping order does not obscure contract changes.

## Internal access for ARM

The Java ARM generator supports `Azure.ClientGenerator.Core.@access(Access.internal)`
on operations, models, and enums, including enum-like unions:

```typespec
@access(Access.internal, "java")
op inspect is ArmResourceActionSync<Widget, InternalRequest, InternalResult>;
```

Internal operations remain generated as package-private implementation methods
for SDK customization in the implementation package. They are omitted from public
low-level client interfaces and fluent resource APIs, including their sync/async,
paging, and long-running-operation variants.

Internal-only models and enums are generated under `implementation.models`, without
public fluent model wrappers. Classes can remain Java-public for references from
other implementation packages; this package is not exported by the generated Java
module. Public usage takes precedence when a type is shared with a public API.
Language scopes and inherited namespace access follow the existing access rules.
Existing ARM model-retention rules are unchanged; internal access alone does not
keep an otherwise unused model in the generated SDK.
