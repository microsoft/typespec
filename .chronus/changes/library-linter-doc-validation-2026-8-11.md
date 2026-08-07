---
changeKind: feature
packages:
  - "@typespec/library-linter"
---

Add `missing-documentation` and `extraneous-documentation` rules

`missing-documentation` reports public declarations and members of a library that have no doc
comment or `@doc`, so gaps in the generated reference documentation are caught at build time.

`extraneous-documentation` reports doc comments that document something that doesn't exist, such as
a `@param` naming a parameter the operation doesn't have, a `@template` copied from an enclosing
interface, or an unescaped code reference the parser mistook for a tag:

```typespec
/**
 * Creates or updates an instance of the resource.
 * @template Resource The resource model.  // `create` is not templated: the interface is
 */
create(resource: Resource): Resource;
```

Declarations in a `Private` namespace and declarations marked `internal` are excluded.
