---
jsApi: true
title: "[F] resolveOperationId"

---
```ts
function resolveOperationId(program, operation): string
```

Resolve the OpenAPI operation ID for the given operation using the following logic:
- If `@operationId` was specified use that value
- If operation is defined at the root or under the service namespace return `<operation.name>`
- Otherwise(operation is under another namespace or interface) return `<namespace/interface.name>_<operation.name>`

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `program` | `Program` | TypeSpec Program |
| `operation` | `Operation` | Operation |

## Returns

`string`

Operation ID in this format `<name>` or `<group>_<name>`
