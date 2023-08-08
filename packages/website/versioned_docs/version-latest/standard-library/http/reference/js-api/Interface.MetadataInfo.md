---
jsApi: true
title: "[I] MetadataInfo"
---

Provides information about changes that happen to a data type's payload
when inapplicable metadata is added or invisible properties are removed.

Results are computed on demand and expensive computations are memoized.

## Methods

### getEffectivePayloadType()

```ts
getEffectivePayloadType(type, visibility): Type
```

If type is an anonymous model, tries to find a named model that has the
same set of properties when non-payload properties are excluded.

#### Parameters

| Parameter    | Type                                      |
| :----------- | :---------------------------------------- |
| `type`       | `Type`                                    |
| `visibility` | [`Visibility`](Enumeration.Visibility.md) |

#### Returns

`Type`

#### Source

[metadata.ts:326](https://github.com/markcowl/cadl/blob/3db15286/packages/http/src/metadata.ts#L326)

---

### isEmptied()

```ts
isEmptied(type, visibility): boolean
```

Determines if the given type is a model that becomes empty once
applicable metadata is removed and visibility is applied.

Note that a model is not considered emptied if it was already empty in
the first place, or has a base model or indexer.

When the type of a property is emptied by visibility, the property
itself is also removed.

#### Parameters

| Parameter    | Type                                      |
| :----------- | :---------------------------------------- |
| `type`       | `undefined` \| `Type`                     |
| `visibility` | [`Visibility`](Enumeration.Visibility.md) |

#### Returns

`boolean`

#### Source

[metadata.ts:300](https://github.com/markcowl/cadl/blob/3db15286/packages/http/src/metadata.ts#L300)

---

### isOptional()

```ts
isOptional(property, visibility): boolean
```

Determines if the given property is optional in the request or
response payload for the given visibility.

#### Parameters

| Parameter    | Type                                      |
| :----------- | :---------------------------------------- |
| `property`   | `ModelProperty`                           |
| `visibility` | [`Visibility`](Enumeration.Visibility.md) |

#### Returns

`boolean`

#### Source

[metadata.ts:320](https://github.com/markcowl/cadl/blob/3db15286/packages/http/src/metadata.ts#L320)

---

### isPayloadProperty()

```ts
isPayloadProperty(property, visibility): boolean
```

Determines if the given property is part of the request or response
payload and not applicable metadata [isApplicableMetadata](Function.isApplicableMetadata.md) or
filtered out by the given visibility.

#### Parameters

| Parameter    | Type                                      |
| :----------- | :---------------------------------------- |
| `property`   | `ModelProperty`                           |
| `visibility` | [`Visibility`](Enumeration.Visibility.md) |

#### Returns

`boolean`

#### Source

[metadata.ts:314](https://github.com/markcowl/cadl/blob/3db15286/packages/http/src/metadata.ts#L314)

---

### isTransformed()

```ts
isTransformed(type, visibility): boolean
```

Determines if the given type is transformed by applying the given
visibility and removing invisible properties or adding inapplicable
metadata properties.

#### Parameters

| Parameter    | Type                                      |
| :----------- | :---------------------------------------- |
| `type`       | `undefined` \| `Type`                     |
| `visibility` | [`Visibility`](Enumeration.Visibility.md) |

#### Returns

`boolean`

#### Source

[metadata.ts:307](https://github.com/markcowl/cadl/blob/3db15286/packages/http/src/metadata.ts#L307)
