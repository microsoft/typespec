---
title: "Data types"
---

## TypeSpec.OpenAPI

### `AdditionalInfo` {#TypeSpec.OpenAPI.AdditionalInfo}

Additional information for the OpenAPI document.

```typespec
model TypeSpec.OpenAPI.AdditionalInfo
```

#### Properties

| Name            | Type                                                  | Description                                                                                                                       |
| --------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| title?          | `string`                                              | The title of the API. Overrides the `@service` title.                                                                             |
| summary?        | `string`                                              | A short summary of the API. Overrides the `@summary` provided on the service namespace.                                           |
| version?        | `string`                                              | The version of the OpenAPI document (which is distinct from the OpenAPI Specification version or the API implementation version). |
| termsOfService? | `url`                                                 | A URL to the Terms of Service for the API. MUST be in the format of a URL.                                                        |
| contact?        | [`Contact`](./data-types.md#TypeSpec.OpenAPI.Contact) | The contact information for the exposed API.                                                                                      |
| license?        | [`License`](./data-types.md#TypeSpec.OpenAPI.License) | The license information for the exposed API.                                                                                      |

### `Contact` {#TypeSpec.OpenAPI.Contact}

Contact information for the exposed API.

```typespec
model TypeSpec.OpenAPI.Contact
```

#### Properties

| Name   | Type     | Description                                                                                      |
| ------ | -------- | ------------------------------------------------------------------------------------------------ |
| name?  | `string` | The identifying name of the contact person/organization.                                         |
| url?   | `url`    | The URL pointing to the contact information. MUST be in the format of a URL.                     |
| email? | `string` | The email address of the contact person/organization. MUST be in the format of an email address. |

### `License` {#TypeSpec.OpenAPI.License}

License information for the exposed API.

```typespec
model TypeSpec.OpenAPI.License
```

#### Properties

| Name | Type     | Description                                                            |
| ---- | -------- | ---------------------------------------------------------------------- |
| name | `string` | The license name used for the API.                                     |
| url? | `url`    | A URL to the license used for the API. MUST be in the format of a URL. |
