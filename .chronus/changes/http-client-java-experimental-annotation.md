---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Generate a configurable Java annotation for APIs marked with `@TypeSpec.HttpClient.experimental`.
Set `experimental-annotation` to the annotation's fully qualified class name to enable generation:

```yaml
options:
  "@typespec/http-client-java":
    experimental-annotation: "com.example.annotations.Experimental"
```

The generated annotation has a required `String warningText()` element and a `WARNING_TEXT` constant
containing `Preview API - subject to change in non-backwards compatible way`.
Generated code imports the annotation and uses `@Experimental(warningText = Experimental.WARNING_TEXT)`;
Java code customizations can supply a custom `warningText` value.
