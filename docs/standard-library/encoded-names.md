---
id: encoded-names
title: Encoded names
---

There is some cases where the name you have in TypeSpec might differ from the name over the wire or for a certain language.

## Update name for a given target

To update the name of a TypeSpec entity you can use the `@encodedName` decorator. This decorator takes 2 parameters:

| Parameter     | Type     | Description                                                                                                                                                                                                            |
| ------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mimeType`    | `string` | Mime type this should apply to. The mime type should be a known mime type as described here https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types without any suffix (e.g. `+json`) |
| `encodedName` | `string` | The name should be when serialized to the given mime type.                                                                                                                                                             |

Example:

```typespec
model Foo {
  // Specify that when serializing to JSON `expireAt` property should be named `exp`
  @encodedName("json", "exp")
  expireAt: string;
}
```

## Example

```typespec
model CertificateAttributes {
  @encodedName("application/json", "nbf")
  notBefore: int32;

  @encodedName("application/json", "exp")
  @encodedName("application/xml", "ExpireAt")
  expires: int32;

  created: int32;
  updated: int32;
}
```

<table>
<thead>
<tr>
<th>Json</th>
<th>Xml</th>
<th>Yaml</th>
</tr>
</thead>
<tr>
<td>When serialized to `application/json` properties will use the encodedName for `application/json` if available or default to the property name.</td>
<td>When serialized to `application/xml` properties will use the encodedName for `application/xml` if available or default to the property name.</td>
<td>Yaml didn't provide any different names so it will serialize using the property names.</td>
</tr>
<tr>
<td>

```json
{
  "nbf": 1430344421,
  "exp": 2208988799,
  "created": 1493938289,
  "updated": 1493938291
}
```

</td>
<td>

```xml
<CertificateAttributes>
  <notBefore>1430344421</notBefore>
  <ExpireAt>2208988799</ExpireAt>
  <created>1493938289</created>
  <updated>1493938291</updated>
</CertificateAttributes>
```

</td>

<td>

```yaml
notBefore: 1430344421
expires: 2208988799
created: 1493938289
updated: 1493938291
```

</td>
</tr>
</table>

## Use in library/emitter

To consume the value of `@encodedName` in your library or emitter you can use `resolveEncodedName(target: Type, mimeType: string): string` from the compiler.

```ts
import { resolveEncodedName } from "@typespec/compiler";

// Resolve the encoded name for the given property and mime type. If the property doesn't have a encoded name for the given mime type it will return the property name.
const encodedName = resolveEncodedName(property, "application/json");

// You can also pass a full http mime type and `resolveEncodedName` will automatically resolve it to the base mime type.
const encodedName = resolveEncodedName(property, "application/merge-patch+json");
```
