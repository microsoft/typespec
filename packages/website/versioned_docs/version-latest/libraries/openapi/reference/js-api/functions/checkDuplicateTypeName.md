---
jsApi: true
title: "[F] checkDuplicateTypeName"

---
```ts
function checkDuplicateTypeName(
   program, 
   type, 
   name, 
   existing): void
```

Check the given name is not already specific in the existing map. Report a diagnostic if it is.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `program` | `Program` | Program |
| `type` | `Type` | Type with the name to check |
| `name` | `string` | Name to check |
| `existing` | `undefined` \| `Record`<`string`, `unknown`\> | Existing map of name |

## Returns

`void`
