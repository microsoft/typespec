---
title: "Data types"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Data types

## TypeSpec.OpenAPI

### `AdditionalInfo` {#TypeSpec.OpenAPI.AdditionalInfo}

Additional information for the OpenAPI document.

```typespec
model TypeSpec.OpenAPI.AdditionalInfo
```

#### Properties

| Name            | Type                                   | Description                                                                      |
| --------------- | -------------------------------------- | -------------------------------------------------------------------------------- |
| termsOfService? | `url`                                  | A URL to the Terms of Service for the API. MUST be in the format of a URL.<br /> |
| contact?        | [`Contact`](#TypeSpec.OpenAPI.Contact) | The contact information for the exposed API.<br />                               |
| license?        | [`License`](#TypeSpec.OpenAPI.License) | The license information for the exposed API.<br />                               |

### `Contact` {#TypeSpec.OpenAPI.Contact}

Contact information for the exposed API.

```typespec
model TypeSpec.OpenAPI.Contact
```

#### Properties

| Name   | Type     | Description                                                                                            |
| ------ | -------- | ------------------------------------------------------------------------------------------------------ |
| name?  | `string` | The identifying name of the contact person/organization.<br />                                         |
| url?   | `url`    | The URL pointing to the contact information. MUST be in the format of a URL.<br />                     |
| email? | `string` | The email address of the contact person/organization. MUST be in the format of an email address.<br /> |

### `License` {#TypeSpec.OpenAPI.License}

License information for the exposed API.

```typespec
model TypeSpec.OpenAPI.License
```

#### Properties

| Name | Type     | Description                                                                  |
| ---- | -------- | ---------------------------------------------------------------------------- |
| name | `string` | The license name used for the API.<br />                                     |
| url? | `url`    | A URL to the license used for the API. MUST be in the format of a URL.<br /> |
