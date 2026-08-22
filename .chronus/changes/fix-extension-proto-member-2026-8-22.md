---
changeKind: fix
packages:
  - "@typespec/openapi"
---

Fix `@extension` dropping a member named `__proto__` from an object value. The member is now kept as a regular own property instead of being assigned through the `Object.prototype.__proto__` setter, which dropped it and, when its value was an object, made that value the prototype of the stored extension.
