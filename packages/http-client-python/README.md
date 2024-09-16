# TypeSpec Python Client Emitter

## Getting started

### Initialize TypeSpec Project

Follow [TypeSpec Getting Started](https://typespec.io/docs) to initialize your TypeSpec project.

Make sure `npx tsp compile .` runs correctly.

### Add `@typespec/http-client-python` to your project

Include `@typespec/http-client-python` in `package.json`:

```diff
 "dependencies": {
+      "@typespec/http-client-python": "latest"
  },
```

Run `npm install` to install the dependency.

### Generate a Python client library

You can either specify `@typespec/http-client-python` on the commandline or through tspconfig.yaml.

#### Generate with `--emit` command

Run command `npx tsp compile --emit @typespec/http-client-python <path-to-typespec-file>`

e.g.

```cmd
npx tsp compile main.tsp --emit @typespec/http-client-python
```

or

```cmd
npx tsp compile client.tsp --emit @typespec/http-client-python
```

#### Generate with tspconfig.yaml

Add the following configuration in tspconfig.yaml:

```diff
emit:
  - "@typespec/http-client-python"
options:
  "@typespec/http-client-python":
+    package-dir: "contoso"
+    package-name: "contoso"
```

Run the command to generate your library:

```cmd
npx tsp compile main.tsp
```

or

```cmd
npx tsp compile client.tsp
```

## Configure the generated library

You can further configure the generated client library using the emitter options provided through @typespec/http-client-python.

You can set options in the command line directly via `--option @typespec/http-client-python.<optionName>=XXX`, e.g. `--option @typespec/http-client-python.package-name="contoso"`

or

Modify `tspconfig.yaml` in the TypeSpec project to add emitter options under options/@typespec/http-client-python.

```diff
emit:
  - "@typespec/http-client-python"
options:
  "@typespec/http-client-python":
+    package-dir: "{package-dir}"
+    package-name: "contoso"
```

### Supported emitter options

Common emitter configuration example:

```yaml
emit:
  - "@typespec/http-client-python"
options:
  "@typespec/http-client-python":
    package-dir: "{package-dir}"
    package-name: "contoso"
```

| Option                     | Type    | Description                                                                                                                                                                                |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `package-version`          | string  | Specify the package version. Default version: `1.0.0b1`.                                                                                                                                   |
| `package-name`             | string  | Specify the package name.                                                                                                                                                                  |
| `package-dir`              | string  | Specify the output directory for the package.                                                                                                                                              |
| `generate-packaging-files` | boolean | Indicate if packaging files, such as setup.py, should be generated.                                                                                                                        |
| `package-pprint-name`      | string  | Specify the pretty print name for the package.                                                                                                                                             |
| `flavor`                   | string  | Represents the type of SDK that will be generated. By default, there will be no branding in the generated client library. Specify `"azure"` to generate an SDK following Azure guidelines. |
| `company-name`             | string  | Specify the company name to be inserted into licensing data. For `"azure"` flavor, the default value inserted is `Microsoft`.                                                              |

**Advanced emitter options**

| Option                   | Type    | Description                                                                                                                        |
| ------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `head-as-boolean`        | boolean | Generate head calls to return a boolean. Default: `true`.                                                                          |
| `packaging-files-dir`    | string  | Pass in the path to a custom directory with SDK packaging files.                                                                   |
| `packaging-files-config` | object  | Specify configuration options that will be passed directly into the packaging files specified by the `packaging-files-dir` option. |
| `tracing`                | boolean | Only available for the `"azure"` flavor of SDKs, provide tracing support in the generated client library. Default: `true`.         |
| `debug`                  | boolean | Enable debugging.                                                                                                                  |
