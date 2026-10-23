# Automatic naming conversions

The C# HTTP client emitter converts TypeSpec names into C# identifiers and applies additional .NET
naming conventions. These conversions affect generated API names, not HTTP parameter names, JSON
property names, or enum values on the wire.

This reference describes the built-in `ScmCodeModelGenerator`. Custom generators and plugins can
change these rules. Examples assume a new SDK without handwritten C# customizations or a previously
published contract. See [overrides and backward compatibility](#overrides-and-backward-compatibility)
for cases where the generated name differs.

The scope is SDK declaration names and generated public parameters, not temporary variables inside
generated method bodies.

The shared client-generator core first determines SDK names, including names for anonymous types,
operation groups, and client customizations. The C# emitter then applies the conversions below.
Consequently, an input name in a table is the SDK name reaching the C# naming step, which need not be
the original TypeSpec declaration name.

## Identifier casing and cleanup

Types, model properties, enum members, and operations normally use PascalCase. Parameters and
property-derived constructor or model-factory parameters use camelCase.

| Input       | PascalCase identifier | camelCase identifier |
| ----------- | --------------------- | -------------------- |
| `petName`   | `PetName`             | `petName`            |
| `pet_name`  | `PetName`             | `petName`            |
| `pet-name`  | `PetName`             | `petName`            |
| `Tls_1_0`   | `Tls10`               | `tls10`              |
| `OSProfile` | `OSProfile`           | `osProfile`          |
| `DNS`       | `DNS`                 | `dns`                |
| `123Name`   | `_123Name`            | `_123Name`           |

Underscores and characters that are not valid identifier parts act as word separators: they are
removed, and the next character is capitalized. Leading characters that cannot start an identifier
are skipped; a name starting with a digit instead receives an underscore prefix. Existing internal
capitalization is otherwise retained. This is not a general word tokenizer: for example,
`UPPER_CASE` becomes `UPPERCASE`, not `UpperCase`.

C# keywords recognized by the generator are escaped with `@` when written as identifiers, for
example a parameter named `class` becomes `@class`. The `@` is C# syntax, not part of the wire name.

## Acronyms

The following replacements apply to new model, enum, and client type names, model properties, enum
members, and public operation names:

| Input sequence   | Replacement | Example                                     |
| ---------------- | ----------- | ------------------------------------------- |
| `Ipv4` or `IpV4` | `IPv4`      | `Ipv4Address` becomes `IPv4Address`         |
| `Ipv6` or `IpV6` | `IPv6`      | `IpV6Address` becomes `IPv6Address`         |
| `Ip`             | `IP`        | `PublicIpAddress` becomes `PublicIPAddress` |
| `Db`             | `DB`        | `DbAccount` becomes `DBAccount`             |
| `Os`             | `OS`        | `OsProfile` becomes `OSProfile`             |

A replacement requires the input sequence to end the name or be followed by an uppercase character.
Matching is case-sensitive, except for an acronym at the beginning of a method parameter name.
For example, `IpAddress` changes, but `Ipaddress` does not. There is no general rule to uppercase
other acronyms.

Method parameters retain camelCase: `dbAccount` stays `dbAccount`, `publicIpAddress` becomes
`publicIPAddress`, and a leading IPv4/IPv6 acronym is written as `ipv4`/`ipv6`, for example
`IPv6Address` becomes `ipv6Address`. Client-initialization parameters do not run through the same
method-parameter acronym normalization. Parameters derived from model properties use the generated
property name converted to camelCase.

## Date and time names

Model properties and parameters with an SDK date-time type, or `plainDate`, normalize recognized
suffixes to `On`. Nullable wrappers receive the same treatment. The conversion is based on the input
SDK type, not just the spelling of the name or a custom C# type mapping. A string named `startTime`
does not receive a date-time rename.

The recognized suffixes are `Timestamp`, `TimeStamp`, `DateTime`, `Time`, `Date`, `On`, and `At`.
Suffix matching is case-sensitive, except for standalone `date` and `timestamp` spellings, which are
left unchanged. An existing `On` suffix still participates in the noun-to-verb rules below.

The `DateTime` suffix is recognized only in names longer than `DateTime`. A standalone `DateTime`
instead matches `Time`, producing the property name `DateOn` or parameter name `dateOn`.

| Date/time input name  | Generated property  | Generated parameter |
| --------------------- | ------------------- | ------------------- |
| `createdAt`           | `CreatedOn`         | `createdOn`         |
| `deletedTime`         | `DeletedOn`         | `deletedOn`         |
| `stateTransitionTime` | `StateTransitionOn` | `stateTransitionOn` |
| `startTime`           | `StartsOn`          | `startsOn`          |
| `endOn`               | `EndsOn`            | `endsOn`            |
| `leaseStartDateTime`  | `LeaseStartsOn`     | `leaseStartsOn`     |
| `accountCreationDate` | `AccountCreatedOn`  | `accountCreatedOn`  |
| `ipStartTime`         | `IPStartsOn`        | `ipStartsOn`        |
| `dateTime`            | `DateOn`            | `dateOn`            |

The stem before the suffix is also converted from these nouns to verbs:

| Stem           | Replacement |
| -------------- | ----------- |
| `Change`       | `Changed`   |
| `Creation`     | `Created`   |
| `Deletion`     | `Deleted`   |
| `End`          | `Ends`      |
| `Expiration`   | `Expires`   |
| `Expire`       | `Expires`   |
| `Modification` | `Modified`  |
| `Start`        | `Starts`    |

These rules match an entire stem case-insensitively, or a final PascalCase component of a compound
stem. For example, `AccessTierChangeTime` becomes `AccessTierChangedOn`, while `RecreationTime`
becomes `RecreationOn`, not `RecreatedOn`.

The following names are excluded from date/time normalization, although ordinary identifier casing
and acronym rules can still apply:

| Exclusion                                                                | Examples                                                 |
| ------------------------------------------------------------------------ | -------------------------------------------------------- |
| The selected suffix is the entire name                                   | `Date`, `Timestamp`, `TimeStamp`                         |
| The entire stem is `First` or `Last`, ignoring case                      | `firstTimestamp`, `LastAt`                               |
| The name starts with `From` or `To`, ignoring case                       | `fromTime`, `toDate`, `TotalTime`, `TokenExpirationDate` |
| The name ends with `PointInTime`, ignoring case                          | `pointInTime`, `recoveryPointInTime`                     |
| The entire name is `StatusTimestamp` or `StatusTimeStamp`, ignoring case | `statusTimestamp`, `StatusTimeStamp`                     |

The `From`/`To` exclusion checks a prefix, not a word boundary. The `StatusTimestamp` exclusion is
an exact-name exclusion: `lastSyncTimestamp` still becomes `LastSyncOn` as a property.

## Model names ending in Response

A non-error model whose generated name ends with the case-sensitive suffix `Response` uses `Result`
instead. For example, `WidgetResponse` becomes `WidgetResult`. This rule is not limited to models
used only as operation outputs.

The emitter keeps `Response` when the model is an error model, has an exact name, or an existing
handwritten type or previous contract requires the `Response` spelling. Acronym normalization can
combine with this rule: a new `IpResponse` model becomes `IPResult`.

## Operation names

After identifier cleanup, operations receive these conversions:

| Input operation      | Generated synchronous method | Rule                                                     |
| -------------------- | ---------------------------- | -------------------------------------------------------- |
| `list`               | `GetAll`                     | The entire name is `List`                                |
| `listPets`           | `GetPets`                    | `List` followed by an uppercase character becomes `Get`  |
| `listall`            | `Listall`                    | No uppercase character after `List`; no verb replacement |
| `getCallbackUrl`     | `GetCallbackUri`             | A final `Url` becomes `Uri`                              |
| `getPublicIpAddress` | `GetPublicIPAddress`         | Acronym normalization                                    |

The `List` convention applies to operation names regardless of whether the operation is pageable.
The emitter does not infer or remove other verb prefixes from the HTTP method.

Asynchronous methods append `Async` to the resulting name, for example `GetPetsAsync`. This suffix
is still added when the operation has an exact name.

### Url suffix

The case-sensitive final `Url` replacement applies to operation names and enum member names.
For example, an enum member `callbackUrl` becomes `CallbackUri`. It does **not** apply generally
to model names, model properties, parameters, or namespace segments.

`CallbackURL`, `CallbackUrls`, and `CallbackUrlValue` do not match the suffix rule. Existing
customizations or a previous contract can preserve a `Url` spelling.

If applying an operation's `Url` or acronym normalization would collide with another operation's
projected name, including its `Async` counterpart, the emitter retains that operation's name before
those normalizations. This is not a general resolver for every possible method-name collision.

## Parameter names

In addition to casing, acronym, and date/time rules, paging operations apply these conversions:

| Input                                                    | Generated name | Scope                                                                                                |
| -------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------- |
| `top`, ignoring case                                     | `maxCount`     | A paging operation parameter whose original name is `top`, unless it is also the page-size parameter |
| A casing variant of `maxPageSize`, such as `maxpagesize` | `maxPageSize`  | The parameter identified by paging metadata as the page-size parameter                               |

Other page-size names are not generally changed to `maxPageSize`. These paging conversions do not
apply to non-paging operations. Exact names and matching previously published parameter names can
prevent a conversion.

Page-size metadata is applied after the `top` conversion. If the original parameter name and the
page-size metadata name are both `top`, the metadata supersedes `maxCount` and the parameter stays
`top`, even without an exact name or a previous contract.

Some parameters describe generated infrastructure rather than a renamed service parameter:

| Generated surface                                 | Name                                                       |
| ------------------------------------------------- | ---------------------------------------------------------- |
| Raw request-body parameter on protocol methods    | `content`                                                  |
| Generated content-type parameter                  | `contentType`                                              |
| Convenience-method cancellation token             | `cancellationToken`                                        |
| Protocol request options                          | `options` in the built-in generator                        |
| Client options and settings constructor arguments | `options`, `settings`                                      |
| Key/token credential constructor arguments        | `credential`; token-provider arguments use `tokenProvider` |

If a protocol method already has a service parameter named `options`, the generated request-options
parameter becomes `requestOptions`. If that also conflicts, it uses `requestOptions1`,
`requestOptions2`, and so on. These collision checks ignore case.

Multipart file constructor overloads derive auxiliary names from the part parameter: for a part
named `file`, the generated names can include `fileFilename`, `fileContentType`, and `filePath`.
Literal filename or content-type metadata does not need its own argument; stream/data overloads
keep the part parameter's name rather than adding `Path`.

## Enum members and API versions

Ordinary fixed and extensible enum members use identifier cleanup, final `Url` replacement, and
acronym normalization. In particular, underscores are normally removed: `Tls_1_0` becomes `Tls10`.
This changes the C# member, not its serialized value. Extensible enums use a private backing
constant named `<MemberName>Value`.

When a previous enum has a uniquely matching member after ignoring underscores and case, the
generator can retain its published spelling, for example `Tls_1_0`. Ambiguous matches or names
already claimed by custom members are not automatically reassigned.

API-version enums use a separate convention:

| Input or situation                                   | Generated name                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Single-service API-version enum                      | `ServiceVersion`                                                                     |
| Multiple API-version enums on a multi-service client | `<LastServiceNamespaceSegment>ServiceVersion`                                        |
| Colliding last service-namespace segments            | `<ShortestUniqueNamespaceSuffix>Version`, with the suffix cleaned into an identifier |
| Version `1.0.0`, `v1.0.0`, or `V1.0.0`               | `V1_0_0`                                                                             |
| Version `v2022.05.15-preview`                        | `V2022_05_15_Preview`                                                                |

Version-member conversion removes an existing leading `v`/`V`, prepends `V`, replaces dots and
hyphens with underscores, and applies invariant title casing. These members are not processed by
the ordinary enum-member underscore-removal rule.

For multi-service namespace disambiguation, the generator adds namespace segments from right to
left until the suffix is unique. If the full namespace still collides, the input enum name is
appended. On the non-colliding last-segment path, the `ServiceVersion` suffix is not repeated when
the last segment already ends with that suffix, ignoring case.

The namespace-disambiguation path always appends `Version`, even when the unique suffix already
ends in `Version`. For example, `A.ServiceVersion` and `B.ServiceVersion` produce
`AServiceVersionVersion` and `BServiceVersionVersion`.

## Namespace and client names

Each namespace segment receives PascalCase identifier cleanup independently. For example,
`pet_store.models` becomes `PetStore.Models`. Namespace segments do not receive the acronym,
date/time, or `Url` conversions above.

The segments `Type`, `Array`, and `Enum` are prefixed with `_` after cleanup, for example
`type.array` becomes `_Type._Array`. A segment that matches a client name is also marked for this
escaping. When this changes a client's final namespace segment, the generator reports
`client-namespace-conflict`; use a client-name customization to resolve it.

When `package-name` supplies the root namespace, hyphens become dots and the first letter of each
segment is capitalized: `pet-store` produces `Pet.Store`. Otherwise, root namespace selection uses
the service or multi-service SDK namespace.

The shared client-generator core determines the initial client names and hierarchy. C# additionally:

- Appends `Client` to a non-exact multi-service root client name unless it already ends in `Client`,
  ignoring case.
- Cleans client names while loading the code model. Root clients and direct children keep their
  cleaned names; deeper clients prepend ancestor client names, excluding the root. For a hierarchy
  `A` -> `B` -> `C`, the deepest client is named `BC`.
- Applies the type-name acronym rules, subject to exact names, customizations, and compatibility.
- Names a child-client accessor `Get<ClientName>`, appending `Client` if the client name does not
  already end in it, ignoring case. Both `Pets` and `PetsClient` therefore produce `GetPetsClient`.

### Names derived from generated types

| Generated declaration                                        | Naming convention                                                                                              |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Client-specific options type                                 | `<ClientName>Options`                                                                                          |
| Client settings type                                         | `<ClientName>Settings`                                                                                         |
| Shared options type, when clients are eligible to share one  | `<RootNamespaceWithoutDots>ClientOptions`                                                                      |
| Model factory type                                           | `<RootNamespaceWithoutDots>ModelFactory`                                                                       |
| Model factory method                                         | The generated model name                                                                                       |
| Properties exposed for client parameters in options/settings | The parameter name converted to PascalCase                                                                     |
| Single-service options version property                      | `Version`                                                                                                      |
| Multi-service options version property                       | `<LastServiceNamespaceSegment>ApiVersion`, disambiguated with the shortest unique namespace suffix when needed |

Options sharing requires multiple root clients without multi-service or per-service version
requirements, nonstandard endpoint parameters, or defaulted custom parameters requiring their own
options properties. It does not apply to every multi-client library.

Derived names follow a generated client's effective name, including acronym changes. Explicitly
customized dependent types are not automatically renamed.

## Synthesized names and collisions

Some naming decisions happen while building or loading the code model rather than in a C# casing
helper:

| Situation                                                        | Behavior                                                                                                                                                             |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Constant or constant-derived enum used as a model property       | Uses `<ModelName><PropertyNameWithFirstLetterCapitalized>`                                                                                                           |
| Repeated constant names                                          | Later occurrences receive `1`, `2`, and subsequent numeric suffixes                                                                                                  |
| Repeated model names in the same target namespace                | Later occurrences receive `1`, `2`, and subsequent numeric suffixes                                                                                                  |
| Model property has the same name as its enclosing generated type | Appends `Property`, for example `Widget.Widget` becomes `Widget.WidgetProperty`                                                                                      |
| Additional-properties dictionaries                               | The first exposed dictionary is `AdditionalProperties`; additional dictionaries derive names from their value/collection types, such as `AdditionalStringProperties` |

When raw additional-property data is exposed alongside typed dictionaries, its property is named
`AdditionalBinaryDataProperties`; if it is the only exposed dictionary, it uses `AdditionalProperties`.

Anonymous models, unions converted to enums, and names derived from template instantiations can
already have synthesized names from the shared client-generator core before these steps run.
Numeric suffixes depend on discovery order and are not a naming-customization mechanism.

The collision rules in this reference are specific to their surfaces. There is no universal promise
that every pair of names collapsing to the same C# identifier will be disambiguated automatically.

## Overrides and backward compatibility

An ordinary `@clientName("...", "csharp")` supplies an SDK name but does not, by itself, disable
C# naming conversions. Use the shared client-generator core's `exact` helper when a supported
declaration must opt out of the normal name transformations:

```typespec
import "@azure-tools/typespec-client-generator-core";

using Azure.ClientGenerator.Core;

model Widget {
  @clientName(exact("CreationTime"), "csharp")
  creationTime: utcDateTime;
}
```

The property is named `CreationTime` rather than `CreatedOn`. Directly named model/enum types,
properties, enum values, operations, and method parameters with an exact name skip their normal
provider-level conversions and do not have a previous contract's spelling substituted for them.

An exact name is not an override of every generated declaration or language constraint:

- Client-name cleanup and nested-client prefixing happen while loading the code model, before
  provider-level exact-name handling.
- Constant-derived names and duplicate model/constant numbering are code-model building steps,
  separate from provider-level exact-name handling.
- A property matching its enclosing type still receives the `Property` collision suffix.
- Parameters derived from an exactly named property still use a camelCase form of the property name.
- Async methods and generated companion types still receive their usual suffixes.
- Namespace cleanup, generated API-version names, and C# keyword escaping are separate steps.

Handwritten C# customizations can explicitly rename or replace types and members. Matching
customizations take precedence over automatic normalization, including when a previous contract
also exists. See the [customization guide](https://github.com/microsoft/typespec/blob/main/packages/http-client-csharp/.tspd/docs/customization.md)
for `[CodeGenType]`, `[CodeGenMember]`, and partial-method customization.

When a prior published contract is available, the generator preserves compatible existing names
rather than treating the tables above as a migration:

- Matching type names can retain their previous acronym or `Response` spelling.
- Matching public properties can retain their pre-normalization name. Date/time properties can
  also match a previous `<Stem>On` spelling when the type and semantic stem agree and no sibling or
  explicit customization owns the name.
- Operations and enum members can retain previously published `Url` and acronym spellings.
- Unambiguous enum members can retain underscores and casing.
- Method parameters, constructors, and model-factory methods can retain published parameter names
  to avoid breaking callers using named arguments.

These are matching rules, not a blanket guarantee that arbitrary renames will be inferred. See the
[backward-compatibility guide](https://github.com/microsoft/typespec/blob/main/packages/http-client-csharp/generator/docs/backward-compatibility.md)
for the supported contract-matching scenarios.

## Implementation reference

The following sources define the built-in rules and their exceptions:

| Area                                          | Source                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Identifier cleanup and parameter casing       | [Input `StringExtensions`](https://github.com/microsoft/typespec/blob/main/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator.Input/src/Extensions/StringExtensions.cs)                                                                                                                                                                                              |
| Acronyms, date/time names, and `Url` suffixes | [`CSharpNameExtensions`](https://github.com/microsoft/typespec/blob/main/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/src/Shared/CSharpNameExtensions.cs)                                                                                                                                                                                                      |
| Models and properties                         | [`ModelProvider`](https://github.com/microsoft/typespec/blob/main/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/src/Providers/ModelProvider.cs), [`PropertyProvider`](https://github.com/microsoft/typespec/blob/main/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/src/Providers/PropertyProvider.cs)                                     |
| Enums and API versions                        | [`EnumProvider`](https://github.com/microsoft/typespec/blob/main/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/src/Providers/EnumProvider.cs), [`ApiVersionEnumProvider`](https://github.com/microsoft/typespec/blob/main/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/src/Providers/ApiVersionEnumProvider.cs)                           |
| Clients, operation names, and derived types   | [`ClientProvider`](https://github.com/microsoft/typespec/blob/main/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator.ClientModel/src/Providers/ClientProvider.cs), [`ClientOptionsProvider`](https://github.com/microsoft/typespec/blob/main/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator.ClientModel/src/Providers/ClientOptionsProvider.cs) |
| Paging parameters                             | [`RestClientProvider`](https://github.com/microsoft/typespec/blob/main/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator.ClientModel/src/Providers/RestClientProvider.cs)                                                                                                                                                                                           |
| Code-model client cleanup and nesting         | [`TypeSpecSerialization`](https://github.com/microsoft/typespec/blob/main/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator.Input/src/InputTypes/Serialization/TypeSpecSerialization.cs)                                                                                                                                                                            |
| Synthesized names and duplicate numbering     | [`client-model-builder`](https://github.com/microsoft/typespec/blob/main/packages/http-client-csharp/emitter/src/lib/client-model-builder.ts)                                                                                                                                                                                                                                        |
| Namespace cleanup and root-name selection     | [`TypeFactory`](https://github.com/microsoft/typespec/blob/main/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/src/TypeFactory.cs), [emitter utilities](https://github.com/microsoft/typespec/blob/main/packages/http-client-csharp/emitter/src/lib/utils.ts)                                                                                                    |
