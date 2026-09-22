### Prerequisite

- Install [Node.js](https://nodejs.org/download/) 20 or above. (Verify by running `node --version`)
- Install [**.NET 8.0 SDK**](https://dotnet.microsoft.com/download/dotnet/8.0) for your specific platform. (or a higher version)

### Customizing Generated Code

For detailed instructions on how to customize the generated C# code, see the [Customization Guide](https://github.com/microsoft/typespec/blob/main/packages/http-client-csharp/.tspd/docs/customization.md).

### Experimental operations

Use `TypeSpec.HttpClient.@experimental` to assign a public diagnostic ID to an operation and
identify experiments used by its implementation:

```typespec
import "@typespec/http-client";

@TypeSpec.HttpClient.experimental(#{
  emitterScope: "@typespec/http-client-csharp",
  diagnosticId: "C",
  dependsOn: #["A", "B"],
})
op bar(): void;
```

The C# emitter adds `[Experimental("C")]` to the generated synchronous and asynchronous
protocol and convenience methods. It disables dependency diagnostics `A` and `B` inside
the generated method and request-helper bodies and restores them at the end of each body.
These suppressions do not affect callers.

Both metadata fields are optional. Without `diagnosticId`, no public experimental attribute
is added; without `dependsOn`, no dependency suppressions are added. Emitter scopes apply to
both fields. C# currently consumes this metadata on operations, not on models or properties.

Graduation is an explicit source change: dependencies becoming generally available, or
removing entries from `dependsOn`, does not remove `[Experimental("C")]`. Remove the
operation's `@experimental` decorator when the public API is ready to graduate.
