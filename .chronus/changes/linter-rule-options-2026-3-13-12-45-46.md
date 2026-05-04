---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add support for configurable options on linter rules

Linter rules can now define typed options with defaults using `defaultOptions`, and users can pass options when enabling rules in `tspconfig.yaml` or rulesets.

**Defining a rule with options:**

```ts
const myRule = createRule({
  name: "no-model-with-name",
  severity: "warning",
  description: "Bans models with a specific name",
  messages: { default: "This model name is not allowed" },
  defaultOptions: { bannedName: "Foo" },
  create(context) {
    return {
      model: (target) => {
        if (target.name === context.options.bannedName) {
          context.reportDiagnostic({ target });
        }
      },
    };
  },
});
```

**Configuring options in `tspconfig.yaml`:**

```yaml
linter:
  enable:
    # Enable with default options
    "@typespec/my-lib/no-model-with-name": true
    # Enable with custom options
    "@typespec/my-lib/no-model-with-name":
      bannedName: "Bar"
```