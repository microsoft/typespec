---
title: Overview
sidebar_position: 0
toc_min_heading_level: 2
toc_max_heading_level: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

TypeSpec library for emitting TypeSpec to JSON Schema and converting JSON Schema to TypeSpec

## Install

<Tabs>
<TabItem value="spec" label="In a spec" default>

```bash
npm install @typespec/json-schema
```

</TabItem>
<TabItem value="library" label="In a library" default>

```bash
npm install --save-peer @typespec/json-schema
```

</TabItem>
</Tabs>

### Emitter usage

[See documentation](./emitter.md)

## TypeSpec.JsonSchema

### Decorators

- [`@baseUri`](./decorators.md#@TypeSpec.JsonSchema.baseUri)
- [`@contains`](./decorators.md#@TypeSpec.JsonSchema.contains)
- [`@contentEncoding`](./decorators.md#@TypeSpec.JsonSchema.contentEncoding)
- [`@contentMediaType`](./decorators.md#@TypeSpec.JsonSchema.contentMediaType)
- [`@contentSchema`](./decorators.md#@TypeSpec.JsonSchema.contentSchema)
- [`@extension`](./decorators.md#@TypeSpec.JsonSchema.extension)
- [`@id`](./decorators.md#@TypeSpec.JsonSchema.id)
- [`@jsonSchema`](./decorators.md#@TypeSpec.JsonSchema.jsonSchema)
- [`@maxContains`](./decorators.md#@TypeSpec.JsonSchema.maxContains)
- [`@maxProperties`](./decorators.md#@TypeSpec.JsonSchema.maxProperties)
- [`@minContains`](./decorators.md#@TypeSpec.JsonSchema.minContains)
- [`@minProperties`](./decorators.md#@TypeSpec.JsonSchema.minProperties)
- [`@multipleOf`](./decorators.md#@TypeSpec.JsonSchema.multipleOf)
- [`@prefixItems`](./decorators.md#@TypeSpec.JsonSchema.prefixItems)
- [`@uniqueItems`](./decorators.md#@TypeSpec.JsonSchema.uniqueItems)

### Models

- [`Json`](./data-types.md#TypeSpec.JsonSchema.Json)
