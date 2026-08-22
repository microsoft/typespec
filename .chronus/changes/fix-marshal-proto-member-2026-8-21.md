---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix object values passed to decorators dropping a member named `__proto__`. The member is now marshalled as a regular own property instead of being assigned through the `Object.prototype.__proto__` setter, which dropped it and, when its value was an object, made that value the prototype of the marshalled object.
