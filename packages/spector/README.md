# Spector

Spector is a tool and typespec library used to describe spec for various protocols and running mock server and mock client based on these specs and some mock apis data.

## Scenario project features

Scenario compilation and mock API validation honor compiler feature flags in the scenario's project configuration. For example, place this `tspconfig.yaml` next to a scenario using `union extends`:

```yaml
kind: project
features:
  - union-extends
```

Configuration errors are reported alongside TypeSpec diagnostics. Spector continues to compile without emitting code and treats compiler warnings as errors; emitter and linter settings do not change its validation behavior.

## Commands

### `serve`

```bash
tsp serve ./path/to/specs/
tsp serve ./path/to/specs/ --port 3000
```

### `server start` and `server stop`

Start the server and stop the server in a separate process.

```bash
tsp server start ./path/to/specs/
... run tests ...
tsp server stop
```

### `knock`

```bash
tsp knock ./path/to/specs/
tsp knock ./path/to/specs/ --baseUrl http://localhost:3000
tsp knock ./path/to/specs/ --filter "payload/multipart/**/*"
```

### Options:

| Option      | Description                              | Default                 |
| ----------- | ---------------------------------------- | ----------------------- |
| `--baseUrl` | Base url for the server                  | `http://localhost:3000` |
| `--filter`  | Filters for which scenarios to run(glob) |                         |
