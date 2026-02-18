---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix @xml.unwrapped handling for non-array model properties. When @xml.unwrapped is used on a property that references a model (not an array or primitive), the emitter now correctly:
1. Uses the model's XML name instead of the property name
2. Sets text to false (not true) since it's a model with structure, not text content

This fixes deserialization issues where unwrapped model properties were incorrectly marked as text content.
