---
jsApi: true
title: "[E] Visibility"

---
Flags enum representation of well-known visibilities that are used in
REST API.

## Enumeration Members

| Enumeration Member | Value | Description |
| :------ | :------ | :------ |
| `All` | `31` | - |
| `Create` | `2` | - |
| `Delete` | `8` | - |
| `Item` | `1048576` | Additional flag to indicate when something is nested in a collection and therefore no metadata is applicable. |
| `None` | `0` | - |
| `Patch` | `2097152` | Additional flag to indicate when the verb is path and therefore will have fields made optional if request visibility includes update. |
| `Query` | `16` | - |
| `Read` | `1` | - |
| `Update` | `4` | - |
