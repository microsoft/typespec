---
jsApi: true
title: "[V] $lib"

---
```ts
const $lib: TypeSpecLibrary<object, Record<string, any>, "data" | "events" | "contentType">;
```

## Type declaration

| Name | Type |
| ------ | ------ |
| `invalid-content-type-target` | `object` |
| `invalid-content-type-target.default` | `"@contentType can only be specified on the top-level event envelope, or the event payload marked with @data"` |
| `multiple-event-payloads` | `object` |
| `multiple-event-payloads.default` | `CallableMessage`<[`"dataPath"`, `"currentPath"`]\> |
| `multiple-event-payloads.payloadInIndexedModel` | `CallableMessage`<[`"dataPath"`]\> |
