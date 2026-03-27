---
changeKind: feature
packages:
  - "@typespec/http-client-csharp"
---

Add virtual `DeserializeXmlValue` and `SerializeXmlValue` APIs to `ScmTypeFactory` for XML value serialization, mirroring the existing `DeserializeJsonValue` and `SerializeJsonValue` APIs. These can be overridden by extending generators to add serialization handling for additional types like `Etag`.

```csharp
public virtual ValueExpression DeserializeXmlValue(
    CSharpType valueType,
    ScopedApi<XElement> element,
    ScopedApi<ModelReaderWriterOptions> mrwOptionsParameter,
    SerializationFormat format)

public virtual MethodBodyStatement SerializeXmlValue(
    CSharpType valueType,
    ValueExpression value,
    ScopedApi<XmlWriter> xmlWriter,
    ScopedApi<ModelReaderWriterOptions> mrwOptionsParameter,
    SerializationFormat serializationFormat)
```
