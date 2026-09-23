### Prerequisite

- Install [Node.js](https://nodejs.org/download/) 20 or above. (Verify by running `node --version`)
- Install [**.NET 8.0 SDK**](https://dotnet.microsoft.com/download/dotnet/8.0) for your specific platform. (or a higher version)

### Customizing Generated Code

For detailed instructions on how to customize the generated C# code, see the [Customization Guide](https://github.com/microsoft/typespec/blob/main/packages/http-client-csharp/.tspd/docs/customization.md).

### Experimental types and members

Use `TypeSpec.HttpClient.@experimental` to assign a public diagnostic ID to a generated
type or member and identify experiments used by its implementation:

```typespec
import "@typespec/http-client";

@TypeSpec.HttpClient.experimental(#{
  emitterScope: "@typespec/http-client-csharp",
  diagnosticId: "C",
  dependsOn: #["A", "B"],
})
op bar(): void;
```

The C# emitter adds `[Experimental("C")]` to the corresponding generated declaration:

| TypeSpec target                                       | Generated C# target                                           |
| ----------------------------------------------------- | ------------------------------------------------------------- |
| Model                                                 | Model class or struct                                         |
| Model property                                        | Property                                                      |
| Enum or union emitted as an enum                      | Enum or extensible-enum struct                                |
| Enum member or union variant emitted as an enum value | Enum field or extensible-enum property                        |
| Operation                                             | Synchronous and asynchronous protocol and convenience methods |
| Namespace or interface emitted as a client            | Client class                                                  |

For example, models and their properties can be separate experiments:

```typespec
@TypeSpec.HttpClient.experimental(#{ diagnosticId: "MODEL001" })
model Preview {
  @TypeSpec.HttpClient.experimental(#{ diagnosticId: "PROPERTY001" })
  value?: string;
}
```

Model factory methods expose the model's diagnostic. Partial serialization declarations
do not repeat the model attribute. Generated code suppresses diagnostics when referring
to source-annotated experimental types and members, so serialization, factories, and client
implementations can compile without changing the experimental status of other public APIs.

For operation dependencies, suppressions surround each method declaration and body.
For type/member dependencies and generated references to experimental declarations,
suppressions are scoped to the generated file. Both include parameter and return types,
generic arguments, and implementation references; neither suppresses diagnostics in
consumer code.

Dependencies identify diagnostics rather than individual types: one diagnostic can apply
to multiple types or members, including those defined in external libraries. External
experiments still require explicit `dependsOn` entries; they are not discovered by reflection.

Both metadata fields are optional. Without `diagnosticId`, no public experimental attribute
is added. Without `dependsOn`, no additional dependency diagnostics are requested; generated
references to source-annotated experiments are still handled. Emitter scopes apply to both fields.

Diagnostic IDs must be single C# warning identifiers (ASCII letters, digits, and underscores,
not starting with a digit) or decimal warning numbers. Whitespace, punctuation, comments, and
line breaks are rejected with `invalid-experimental-diagnostic-id` before generating C#.
An `ExperimentalAttribute` on a customized partial client or method takes precedence over
the generated attribute.

Some TypeSpec declarations have no corresponding C# declaration, such as scalars or unions
mapped to built-in C# types. C# also does not allow `ExperimentalAttribute` on parameters.
The emitter reports `experimental-target-not-supported` for these annotations instead of
silently dropping them or assigning their diagnostic to an unrelated API.

Graduation is an explicit source change: dependencies becoming generally available, or
removing entries from `dependsOn`, does not remove `[Experimental("C")]`. Remove the
declaration's `@experimental` decorator when the public API is ready to graduate.
