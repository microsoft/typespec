---
jsApi: true
title: "[F] getXmlEncoding"

---
```ts
getXmlEncoding(program, type): XmlEncodeData | undefined
```

Resolve how the given type should be encoded in XML.
This will return the default encoding for each types.(e.g. TypeSpec.Xml.Encoding.xmlDateTime for a utcDatetime)

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | `Program` |  |
| `type` | `Scalar` \| `ModelProperty` |  |

## Returns

[`XmlEncodeData`](../interfaces/XmlEncodeData.md) \| `undefined`
