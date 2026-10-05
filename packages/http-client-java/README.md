# @typespec/http-client-java

TypeSpec library for emitting Java client from the TypeSpec REST protocol binding

## Install

```bash
npm install @typespec/http-client-java
```

## Usage

### Prerequisite

Install [Node.js](https://nodejs.org/) 20 or above. (Verify by running `node --version`)

Install [Java](https://docs.microsoft.com/java/openjdk/download) 17 or above. (Verify by running `java --version`)

Install [Maven](https://maven.apache.org/download.cgi). (Verify by running `mvn --version`)

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

**Type:** `object`

License information for the generated client code.

### `dev-options`

**Type:** `object`

Developer options for http-client-java emitter.

#### `generate-protocol-implementation`

**Type:** `boolean`

**Default:** `false`

Experimental option for Azure Core V1 data-plane generation. Add this setting to `dev-options`
in an existing Azure emitter configuration to generate concrete HTTP protocol implementations
instead of runtime `RestProxy` dispatch:

```yaml
dev-options:
  generate-protocol-implementation: true
```

Generated clients require Azure Core `1.61.0-beta.1` or later containing
`com.azure.core.util.GeneratedCodeUtils`. These runtime APIs are currently under development;
use a local runtime build until they are released.

The initial implementation supports buffered synchronous and asynchronous protocol responses.
Streaming responses, ARM clients, and ClientCore/Azure Core V2 are not yet supported with this
option and produce a generation error. Leave the option unset or set it to `false` to retain
the existing generation behavior.
