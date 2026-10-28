---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Generate a configurable Java annotation for Azure APIs marked with `@TypeSpec.HttpClient.experimental`.
Set `experimental-annotation` to the annotation's fully qualified class name to enable generation:

```yaml
options:
  "@azure-tools/typespec-java":
    experimental-annotation: "com.example.annotations.Experimental"
```

The generated annotation has a required `String warningText()` element and a `WARNING_TEXT` constant
containing `Preview API - subject to change in non-backwards compatible way`.
Generated code imports the annotation and uses `@Experimental(warningText = Experimental.WARNING_TEXT)`;
Java code customizations can supply a custom `warningText` value.

Includes generation coverage for experimental annotations and Java warning text customizations,
including Azure v2 implementation methods and Fluent Lite module exports.
Unbranded clients do not support this option or generate experimental annotations.
