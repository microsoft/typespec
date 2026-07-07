## Spector decorators

### `@scenarioService`

Decorator setting up the boilerplate for specs service namespace. Will automatically set:

- `@service{title: '<namespace>', value: '1.0.0'}` using the namespace as a value
- `@server` to `localhost:3000`
- `@route` using the parameter passed.

Usage:

```tsp
@scenarioSpec("/my-spec")
namespace MySpec;
```

### `@scenario`

Mark an operation, interface or namespace as a scenario. Optionally can provide the name of the scenario.

### `@scenarioDoc`

Specify how to implement this scenario. Value is markdown. Differ from @doc which describe the scenario to the end user.

### `@surfaceDoc`

Describe one or more expected properties of the **generated SDK surface** for an element — things a wire test can't see, such as a client rename, an access change, or a reshaped inheritance hierarchy. Mirrors `@scenarioDoc`, but targets the surface instead of the wire. A single `@surfaceDoc` may carry multiple checks (e.g. an element that is both made internal and renamed). The description is stated once, language-agnostically; each emitter validates it against its own generated code.

Usage:

```tsp
@surfaceDoc(#[
  #{ category: "access", doc: "Hidden from the public client surface.", internal: true },
  #{
    category: "naming",
    doc: "Renamed to `WidgetInternal` on the client surface.",
    expected: "WidgetInternal",
    kind: "model",
  }
])
model Widget {
  id: string;
}
```

Run `tsp-spector generate-surface-checks <specsPath>` to precompute a language-neutral `surface-checks.json` manifest from every `@surfaceDoc`, analogous to how `@scenarioDoc` feeds the scenario manifest.
