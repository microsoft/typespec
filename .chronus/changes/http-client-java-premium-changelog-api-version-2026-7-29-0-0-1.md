---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Add `Package api-version` annotation to `CHANGELOG.md` for Fluent Premium. When generating a Premium SDK with an existing `CHANGELOG.md`, the top-most version section gets a `- Package api-version {...}.` line reflecting the service api-version(s), matching the behavior already available for Fluent Lite.
