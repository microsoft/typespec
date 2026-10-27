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
  @TypeSpec.HttpClient.experimental(#{ warningText: "This property may change." })
  value: string;
}
```

The generator creates the configured annotation with a single `String warningText()` element,
whose default is `Preview API - subject to change in non-backwards compatible way`.
The generated model receives `@Experimental`, and the property's accessors receive
`@Experimental(warningText = "This property may change.")`.

Experimental annotations apply to generated models, enums, enum members, model properties,
operations, and client types. `emitterScope` can include or exclude `@typespec/http-client-java`.
The annotation is documented and retained in class files; it does not itself produce Java compiler
warnings. The `diagnosticId` and `dependsOn` options do not affect Java output.

If `experimental-annotation` is omitted, no experimental annotation is generated or applied.
