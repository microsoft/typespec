---
id: projected-names
title: Projected Names
---

# Projected Names

:::warning
The feature "Projected Names" is considered legacy and is planned for deprecation. We recommend using [Encoded Names](encoded-names.md) as a more modern alternative for modifying the name over the network.
:::

In certain scenarios, the name you use in TypeSpec may need to be different from the name used over the network or in a specific programming language.

## Recognized Targets

Here is a list of recognized targets.

- Wire:
  - `json`: Set up JSON data representation
  - `xml`: Set up XML data representation
- Language:
  - `csharp`: Set up C# code generation
  - `java`: Set up Java code generation
  - `python`: Set up Python code generation
  - `javascript`: Set up JavaScript code generation
  - `swift` : Set up Swift code generation
  - `c` : Set up C code generation
- Type:
  - `client`: Set up client-side output
  - `server`: Set up server-side output

## How to Modify a Name for a Specific Target

### Using Decorator

To change the name of a TypeSpec entity, you can use the `@projectedName` decorator. This decorator requires 2 parameters:

- `string` target name. Refer to the [recognized targets](#recognized-targets)
- `string` projected name. This is the name to be used in the specified target.

Example:

```typespec
model Foo {
  // Indicate that the `expireAt` property should be named `exp` when serialized to JSON
  @projectedName("json", "exp")
  expireAt: string;
}
```

### Using Projection

The decorator is essentially a shorthand for the `target` projection. For more complex scenarios, you might prefer to implement the projection manually.

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
<td>When serialized to Json, the property uses the json projected name</td>
<td>Typescript doesn't specify any projected name, so it retains the model as is.</td>
<td>The model uses the `csharp` projected names and maintains the reference to the JSON name in JsonProperty</td>
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
