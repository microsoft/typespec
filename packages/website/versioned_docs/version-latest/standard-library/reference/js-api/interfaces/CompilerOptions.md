---
jsApi: true
title: "[I] CompilerOptions"

---
## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `additionalImports?` | `string`[] | - |
| `config?` | `string` | Path to config YAML file or folder in which to search for default tspconfig.yaml file. |
| `designTimeBuild?` | `boolean` | When true, indicates that a compilation is being performed for live<br />analysis in the language server. |
| `emit?` | `string`[] | List or path to emitters to use. |
| `emitters?` | `Record`<`string`, `EmitterOptions`\> | **Deprecated**<br /><br />use [emit](CompilerOptions.md) and [options](CompilerOptions.md) instead.<br /><br />Will be removed in March 2022 sprint. |
| `ignoreDeprecated?` | `boolean` | Suppress all `deprecated` warnings. |
| `linterRuleSet?` | [`LinterRuleSet`](LinterRuleSet.md) | Ruleset to enable for linting. |
| `miscOptions?` | `Record`<`string`, `unknown`\> | - |
| `noEmit?` | `boolean` | - |
| `nostdlib?` | `boolean` | - |
| `options?` | `Record`<`string`, `EmitterOptions`\> | Emitter options.<br />Key value pair where the key must be the emitter name. |
| `outputDir?` | `string` | Default output directory used by emitters.<br /><br />**Default**<br /><br />` ./tsp-output ` |
| `outputPath?` | `string` | **Deprecated**<br /><br />use outputDir. |
| `parseOptions?` | [`ParseOptions`](ParseOptions.md) | - |
| `trace?` | `string`[] | Trace area to enable. |
| `warningAsError?` | `boolean` | - |
