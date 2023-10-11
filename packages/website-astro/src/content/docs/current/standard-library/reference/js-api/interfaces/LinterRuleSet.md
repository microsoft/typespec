---
jsApi: true
title: "[I] LinterRuleSet"

---
## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `disable?` | `Record`<\`${string}/${string}\`, `string`\> | Rules to disable. A rule CANNOT be in enable and disable map. |
| `enable?` | `Record`<\`${string}/${string}\`, `boolean`\> | Rules to enable/configure |
| `extends?` | \`${string}/${string}\`[] | Other ruleset this ruleset extends |
