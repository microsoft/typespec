---
title: Overview
sidebar_position: 0
toc_min_heading_level: 2
toc_max_heading_level: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

TypeSpec library providing OpenAPI concepts

## Install

<Tabs>
<TabItem value="spec" label="In a spec" default>

```bash
npm install @typespec/openapi
```

</TabItem>
<TabItem value="library" label="In a library" default>

```bash
npm install --save-peer @typespec/openapi
```

</TabItem>
</Tabs>

## OpenAPI

### Decorators

- [`@defaultResponse`](./decorators.md#@OpenAPI.defaultResponse)
- [`@extension`](./decorators.md#@OpenAPI.extension)
- [`@externalDocs`](./decorators.md#@OpenAPI.externalDocs)
- [`@info`](./decorators.md#@OpenAPI.info)
- [`@operationId`](./decorators.md#@OpenAPI.operationId)

### Models

- [`AdditionalInfo`](./data-types.md#OpenAPI.AdditionalInfo)
- [`Contact`](./data-types.md#OpenAPI.Contact)
- [`License`](./data-types.md#OpenAPI.License)
