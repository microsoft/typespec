---
id: projected-names
title: Projected names
---

# Projected Names

There may be situations where the name of a concept in your TypeSpec does not match the value sent over-the-wire or is not ideal for a specific language for which you plan to generate an SDK. The `@projectedName` decorator allows you to specify these customizations in a targeted way, by providing a `target` string along with the desired `name`.

For example:

```typespec
model Foo {
  @projectedName("json", "exp")
  expireAt: string;
}
```

Here the `expireAt` property will be serialized to JSON as `exp` instead of `expireAt`. This is because the service requires the property to be named `exp` when serialized to JSON, but the name `expireAt` is more appropriate for the TypeSpec model as it is more descriptive.

## Known targets

List of known targets.

- Wire:
  - `json`: Configure JSON representation of data
  - `xml`: Configure XML representation of data
- Language:
  - `csharp`: Configure C# generated code
  - `java`: Configure Java generated code
  - `python`: Configure python generated code
  - `javascript`: Configure javascript generated code
  - `swift` : Configure swift generated code
  - `c` : Configure C generated code
- Type:
  - `client`: Configure output for the client
  - `server`: Configure output for the server

## Update name for a given target

### With decorator

To update the name of a TypeSpec entity you can use the `@projectedName` decorator. This decorator takes 2 parameters:

- `string` target name. See [known targets](#known-targets)
- `string` projected name. Whatever the name should be in the given target.

Example:

```typespec
model Foo {
  // Specify that when serializing to JSON `expireAt` property should be serialized to `exp`
  @projectedName("json", "exp")
  expireAt: string;
}
```

### With projection

The decorator is just a syntax sugar for the `target` projection behind the scenes. In more complex cases you might want to just implement the projection manually.

```typespec
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

```typespec
model CertificateAttributes {
  @projectedName("json", "nbf")
  @projectedName("csharp", "ValidAfter")
  notBefore: int32;

  @projectedName("json", "exp")
  expires: int32;

  @projectedName("client", "createdAt")
  created: int32;
  updated: int32;
}
```

<table>
<thead>
<tr>
<th>Json</th>
<th>Typescript</th>
<th>CSharp</th>
</tr>
</thead>
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
  createdAt: number;
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

  [JsonProperty("created")]
  public int CreatedAt {get; set;}

  public int Updated {get; set;}
}
```

</td>
</tr>
</table>

## Order of Operations

For consistency when generating code, the order in which projections are applied is important. Code emitters should apply projections in the following order.

### Over-the-Wire JSON Names

For determining the final name of a TypeSpec entity when sent over-the-wire in JSON:

1. Run the `#target("json")` projection
2. Run the `#customTarget("json")` projection, if it exists
3. Apply the `@projectedName` decorator using the `getProjectedName` helper method.

### Client SDK Names

For determining the final name of a TypeSpec entity when used in a client SDK (e.g. Python):

1. Determine the name based on the client target:
   1. Run the `#target("client")` projection
   1. Run the `#customTarget("client")` projection, if it exists
   1. Apply the `@projectedName` decorator using the `getProjectedName` helper method.
1. Determine the name based on the language target:
   1. Run the `#target("python")` projection
   1. Run the `#customTarget("python")` projection, if it exists
   1. Apply the `@projectedName` decorator using the `getProjectedName` helper method.
1. If the language target name is different from the client target name, use the language target name. Otherwise, use the client name.
1. For names based on language target projections, do not alter the casing. For names based on the client target projections, apply casing heuristics appropriate for the language (for example, snake case, Pascal case, etc.).
