---
id: projected-names
title: Projected names
---

# Projected Names

There is some cases where the name you have in Cadl might difer from the name over the wire or for a certain language.

## Known targets

List of known targets.

- Wire:
  - `json`: Configure JSON representation of data
  - `xml`: Configure XML representation of data
- Language:
  - `csharp`: Configure C# generated code
  - `python`: Configure python generated code
  - `javascript`: Configure javascript generated code
  - `swift` : Configure swift generated code
  - `c` : Configure C generated code
- Type:
  - `client`: Configure output for the client
  - `server`: Configure output for the server

## Update name for a given target

### With decorator

To update the name of a Cadl entity you can use the `@projectedName` decorator. This decorator takes 2 parameters:

- `string` target name. See [known targets](#known-targets)
- `string` projected name. Watever the name should be in the given target.

Example:

```cadl
model Foo {
  // Specify that when serializing to JSON `expireAt` property should be named `exp`
  @projectedName("json", "exp")
  expireAt: string;
}
```

### With projection

The decorator is just a syntax sugar for the `target` projection behind the scenes. In more complex cases you might want to just implement the projection manually.

```cadl
model Foo {
  expireAt: string;
}

projection Foo#target {
  to(targetName) {
    if targetName == "json" {
      self::rename("exp");
    };
  }
}
```

## Example

```cadl
model CertificateAttributes {
  @projectedName("json", "nbf")
  @projectedName("csharp", "ValidAfter")
  notBefore: int32;

  @projectedName("json", "exp")
  expires: int32;
  created: int32;
  updated: int32;
}
```

<table>
<tr>
<td>Json</td>
<td>Typescript</td>
<td>CSharp</td>
</tr>
<tr>
<td>When serialized to Json property use the json projected name</td>
<td>Typescript didn't provide any projected name so it keep the model as it is.</td>
<td>Model uses the `csharp` projected names and keeps the reference to the JSON name in JsonProperty</td>
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

```ts
interface Attributes {
  notBefore: number;
  expires: number;
  created: number;
  updated: number;
}
```

</td>

<td>

```cs
class CertificateAttributes
{
  [JsonProperty("nbf")]
  public int ValidAfter {get; set;}

  [JsonProperty("exp")]
  public int Expires {get; set;}

  public int Created {get; set;}

  public int Updated {get; set;}
}
```

</td>
</tr>
</table>
