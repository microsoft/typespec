# @typespec/http-client-java

TypeSpec library for emitting Java client from the TypeSpec REST protocol binding

## Install

```bash
npm install @typespec/http-client-java
```

## Usage

### Prerequisite

Install a supported [Node.js](https://nodejs.org/) LTS. (Verify by running `node --version`)

Install [Java](https://docs.microsoft.com/java/openjdk/download) 17 or above. (Verify by running `java --version`)

Install [Maven](https://maven.apache.org/download.cgi) (Verify by running `mvn --version`). Maven is needed to build the generated client, but not to run the emitter.

### Experimental server-sent events

For supported Azure v1 data-plane services, the emitter can generate native immutable Java wrappers for named JSON events in an `SSEStream`. The generated base wrapper name comes from the stream union, with an `Events` suffix converted to `Event`.

An event with an authored `@data` envelope uses that envelope's client-facing model name for its generated wrapper. Java `@clientName` overrides are honored, including names marked with `exact(...)`. The authored envelope itself is not generated as a second hierarchy; the generated wrapper contains the actual event payload as its `value`.

Direct payload events and anonymous envelopes continue to derive wrapper names from the wire event name. A payload model's name is not used as an envelope name.

Each event wrapper name must be unique within one stream union. Do not reuse one named envelope for multiple wire events or give distinct envelopes the same Java client name in the same union. Reusing an envelope in separate stream unions remains supported.

## Emitter usage

1. Via the command line

```bash
tsp compile . --emit=@typespec/http-client-java
```

2. Via the config

```yaml
emit:
  - "@typespec/http-client-java"
```

The config can be extended with options as follows:

```yaml
emit:
  - "@typespec/http-client-java"
options:
  "@typespec/http-client-java":
    option: value
```

## Emitter options

### `emitter-output-dir`

**Type:** `absolutePath`

Defines the emitter output directory. Defaults to `{output-dir}/@typespec/http-client-java`
See [Configuring output directory for more info](https://typespec.io/docs/handbook/configuration/configuration/#configuring-output-directory)

### `license`

**Type:** `object { name, company, link, header, description }`

License information for the generated client code.

**Properties:**

| Name          | Type     | Default | Description                                                                                                                                                                                                                      |
| ------------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | `string` |         | License name. The config is required. Predefined license are: MIT License, Apache License 2.0, BSD 3-Clause License, MPL 2.0, GPL-3.0, LGPL-3.0. For other license, you need to configure all the other license config manually. |
| `company`     | `string` |         | License company name. It will be used in copyright sentences.                                                                                                                                                                    |
| `link`        | `string` |         | License link.                                                                                                                                                                                                                    |
| `header`      | `string` |         | License header. It will be used in the header comment of generated client code.                                                                                                                                                  |
| `description` | `string` |         | License description. The full license text.                                                                                                                                                                                      |

### `dev-options`

**Type:** `object { generate-code-model, debug, loglevel, java-temp-dir, profile }`

Developer options for http-client-java emitter.

**Properties:**

| Name                  | Type                                              | Default | Description                                                       |
| --------------------- | ------------------------------------------------- | ------- | ----------------------------------------------------------------- |
| `generate-code-model` | `boolean`                                         |         | Generate intermittent 'code-model.yaml' file in output directory. |
| `debug`               | `boolean`                                         |         | Enable Java remote debug on port 5005.                            |
| `loglevel`            | `"off" \| "debug" \| "info" \| "warn" \| "error"` |         | Log level for Java logging. Default is 'warn'.                    |
| `java-temp-dir`       | `string`                                          |         | Temporary working directory for Java code generator.              |
| `profile`             | `boolean`                                         |         | Enable performance profiling.                                     |
