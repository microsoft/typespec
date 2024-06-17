---
jsApi: true
title: "[I] CompilerOptions"

---
## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `additionalImports?` | `string`[] | - |
| `config?` | `string` | Path to config YAML file used, this is also where the project root should be. |
| `designTimeBuild?` | `boolean` | When true, indicates that a compilation is being performed for live analysis in the language server. |
| `emit?` | `string`[] | List or path to emitters to use. |
| ~~`emitters?`~~ | `Record`<`string`, `EmitterOptions`\> | <p>**Deprecated**</p><p>use [emit](CompilerOptions.md) and [options](CompilerOptions.md) instead.</p><p>Will be removed in March 2022 sprint.</p> |
| `ignoreDeprecated?` | `boolean` | Suppress all `deprecated` warnings. |
| `linterRuleSet?` | [`LinterRuleSet`](LinterRuleSet.md) | Ruleset to enable for linting. |
| `miscOptions?` | `Record`<`string`, `unknown`\> | - |
| `noEmit?` | `boolean` | - |
| `nostdlib?` | `boolean` | - |
| `options?` | `Record`<`string`, `EmitterOptions`\> | Emitter options. Key value pair where the key must be the emitter name. |
| `outputDir?` | `string` | <p>Default output directory used by emitters.</p><p>**Default**</p><code>./tsp-output</code> |
| ~~`outputPath?`~~ | `string` | <p>**Deprecated**</p><p>use outputDir.</p> |
| `parseOptions?` | [`ParseOptions`](ParseOptions.md) | - |
| `trace?` | `string`[] | Trace area to enable. |
| `warningAsError?` | `boolean` | - |
