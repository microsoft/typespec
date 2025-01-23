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
