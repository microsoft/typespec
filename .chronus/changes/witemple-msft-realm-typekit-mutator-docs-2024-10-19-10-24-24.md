---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Experimental: Improve Realm, Mutator, and Typekit implementations.

This change strongly binds a Realm and Typekit together, and changes mutators so that new types are cloned within the
mutator's realm. The default Typekit now creates a default typekit realm for the current program, and a Typekit can be
easily created to work in a specific Program or Realm as needed.
