---
changeKind: dependencies
packages:
  - "@typespec/http-client-java"
---

Compile the Eclipse JDT formatter, its ECJ parser, and the Equinox and JFace text sources they need in the generator's internal implementation namespace instead of depending on the Eclipse artifacts, preserving upstream notices and Java 17 build and runtime compatibility.
