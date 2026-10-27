### Prerequisite

Install [Node.js](https://nodejs.org/) 20 or above. (Verify by running `node --version`)

Install [Java](https://docs.microsoft.com/java/openjdk/download) 17 or above. (Verify by running `java --version`)

Maven is needed to build the generated client, but not to run the emitter.

### Experimental APIs

Set `experimental-annotation` to the fully qualified annotation class name to generate for APIs
marked with `@TypeSpec.HttpClient.experimental`:

```yaml
emit:
  - "@typespec/http-client-java"
options:
  "@typespec/http-client-java":
    experimental-annotation: "com.example.annotations.Experimental"
```

```typespec
import "@typespec/http-client";

@TypeSpec.HttpClient.experimental
model Preview {
  @TypeSpec.HttpClient.experimental
  value: string;
}
```

The generator creates the configured annotation with a required `String warningText()` element
and a `WARNING_TEXT` constant containing
`Preview API - subject to change in non-backwards compatible way`.
The generated model and the property's accessors import the annotation and receive
`@Experimental(warningText = Experimental.WARNING_TEXT)`.
Java code customizations can supply `@Experimental(warningText = "This API may change.")`;
`warningText` is not configurable through the TypeSpec decorator.

Experimental annotations apply to generated models, enums, enum members, model properties,
operations, and client types. `emitterScope` can include or exclude `@typespec/http-client-java`.
The annotation is documented and retained in class files; it does not itself produce Java compiler
warnings. The `diagnosticId` and `dependsOn` options do not affect Java output.

If `experimental-annotation` is omitted, no experimental annotation is generated or applied.
