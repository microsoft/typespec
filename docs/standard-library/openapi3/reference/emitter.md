---
title: "Emitter usage"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Emitter usage

## Usage

1. Via the command line

```bash
tsp compile . --emit=@typespec/openapi3
```

2. Via the config

```yaml
emit:
  - "@typespec/openapi3"
```

## Emitter options

### `file-type`

**Type:** `"yaml" | "json"`

If the content should be serialized as YAML or JSON. Default 'yaml', it not specified infer from the `output-file` extension

### `output-file`

**Type:** `string`

Name of the output file.
Output file will interpolate the following values:

- service-name: Name of the service if multiple
- version: Version of the service if multiple

Default: `{service-name}.{version}.openapi.yaml` or `.json` if `file-type` is `"json"`

Example Single service no versioning

- `openapi.yaml`

Example Multiple services no versioning

- `openapi.Org1.Service1.yaml`
- `openapi.Org1.Service2.yaml`

Example Single service with versioning

- `openapi.v1.yaml`
- `openapi.v2.yaml`

Example Multiple service with versioning

- `openapi.Org1.Service1.v1.yaml`
- `openapi.Org1.Service1.v2.yaml`
- `openapi.Org1.Service2.v1.0.yaml`
- `openapi.Org1.Service2.v1.1.yaml`

### `new-line`

**Type:** `"crlf" | "lf"`

Set the newline character for emitting files.

### `omit-unreachable-types`

**Type:** `boolean`

Omit unreachable types.
By default all types declared under the service namespace will be included. With this flag on only types references in an operation will be emitted.
