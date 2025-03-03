---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: feature
packages:
  - "@typespec/openapi"
---

Migrate `@info` decorator to expect a value

```diff lang="tsp"
-@info({ version: "1.0.0" })
+@info(#{ version: "1.0.0" })
```

```diff lang="tsp"
-@info({
+@info(#{
  termsOfService: "http://example.com/terms/",
-  contact: {
+  contact: #{
    name: "API Support",
    url: "http://www.example.com/support",
    email: "support@example.com"
  },
})
```
