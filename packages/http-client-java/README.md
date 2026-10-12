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

### Response replacement

Use TCGC's `@override` with `replaceResponseWithVoid` or `replaceResponseWithBytes` to
ignore a basic operation's response body or return its raw `BinaryData`, without JSON decoding.
The HTTP status codes, headers, and error responses are preserved.
For Azure clients, protocol methods still expose the original response body.
A bytes replacement of an operation with no declared HTTP response body is ignored with a warning.

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
