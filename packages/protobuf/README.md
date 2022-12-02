# Cadl Protobuf library and emitter

This package provides support for defining and emitting Protobuf specifications in [Cadl](https://github.com/microsoft/cadl) and an emitter that generates Protobuf output from Cadl sources.

## Install

In your project root:

```bash
npm install @cadl-lang/protobuf
```

## Using the Protobuf emitter

1. Using the `cadl` CLI:

```bash
cadl compile . --emit @cadl-lang/protobuf
```

2. Using the Cadl project configuration file:

Add the following to your `cadl-project.yaml` file.

```yaml
emitters:
  @cadl-lang/protobuf: true
```
