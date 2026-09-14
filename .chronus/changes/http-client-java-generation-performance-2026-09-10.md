---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Improve Java generation performance by compiling customizations in memory, sharing parsed Java files across customization, partial update, and import ordering, tokenizing import headers for untouched files, using bounded parallel formatting, preserving schema Javadocs without parsing their contents as Java, and writing ARM debug code models only when debugging is enabled. Customizations continue to run before partial update. Formatter parallelism can be limited when generating multiple clients concurrently.