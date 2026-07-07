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

Describe, in plain natural language, an expected property of the **generated SDK surface** for an element — things a wire test can't see, such as a client rename, an access change, an operation relocated to another client, or a reshaped inheritance hierarchy. Mirrors `@scenarioDoc`, but targets the surface instead of the wire. The description is stated once, language-agnostically; each emitter validates it against its own generated code.

You write the sentence and apply the normal client decorator. The precompute step (`listSurfaceDocs`) inspects the element's own client decorators to derive the machine-checkable, routable fields of each check, so a single element carrying multiple client decorators yields multiple checks. A property with no recognized client decorator becomes an AI-verified check against the prose.

Derived checks (matched by decorator name + namespace, no dependency on the client-generator package):

| Client decorator                                     | Derived check     |
| ---------------------------------------------------- | ----------------- |
| `@clientName` (`Azure.ClientGenerator.Core`)         | `naming`          |
| `@access` (`Azure.ClientGenerator.Core`)             | `access`          |
| `@clientLocation` (`Azure.ClientGenerator.Core`)     | `client-location` |
| `@hierarchyBuilding` (`Azure.ClientGenerator.Core.Legacy`) | `hierarchy` |
| `@list` (`TypeSpec`)                                  | `paging`          |
| _(none recognized)_                                  | AI-verified prose |

For anything the derivation can't infer, pass an explicit `check` as the second argument. It is merged with the derived checks: when its `category` matches a derived check, its provided fields override that check; otherwise it is added as an extra check. This lets an author name a category for prose that has no backing decorator, or attach routing detail (e.g. the expected iterator name).

Usage:

```tsp
@access(Access.internal)
@clientName("WidgetInternal")
@surfaceDoc("Hidden from the public client surface and renamed to `WidgetInternal` for clients.")
model Widget {
  id: string;
}

// Derived automatically from @list.
@surfaceDoc("Surfaces a lazy paged iterator on the client, not a raw response.")
@list
op listItems(): ListPage;

// No backing decorator: state the category explicitly.
@surfaceDoc("Surfaced as a lazy iterator named `ItemPager`.", #{ category: "paging", expected: "ItemPager" })
op streamItems(): Item[];
```

Run `tsp-spector generate-surface-checks <specsPath>` to precompute a language-neutral `surface-checks.json` manifest from every `@surfaceDoc`, analogous to how `@scenarioDoc` feeds the scenario manifest.
