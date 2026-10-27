---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Fix XML serialization to only apply for `azure-v1` data-plane clients, and to skip the XML `ObjectSerializer` for raw `byte[]`/`BinaryData` payloads that are not structured XML models. This avoids emitting a reference to a non-generated `XmlSerializerProviders` helper (which caused a build break) for operations that return raw XML bytes.
