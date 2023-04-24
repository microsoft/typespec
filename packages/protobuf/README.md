# TypeSpec Protobuf library and emitter

**Warning** :warning:: This pre-release emitter is in active development and may change. Your feedback is highly appreciated.

This package provides support for defining and emitting Protobuf specifications in [TypeSpec](https://github.com/microsoft/typespec) and an emitter that generates Protobuf output files from TypeSpec sources.

## Install

In your project root:

```bash
npm install @typespec/protobuf
```

## Using the Protobuf emitter

1. Using the TypeSpec CLI (`tsp`):

```bash
tsp compile . --emit @typespec/protobuf
```

2. Using the TypeSpec project configuration file:

Add the following to your `tspproject.yaml` file.

```yaml
emit:
  - "@typespec/protobuf"
```
