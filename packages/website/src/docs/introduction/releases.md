---
id: releases
title: Releases
---

# Releases

## Package versioning strategy

Cadl is not stable yet, all packages are released with `0.` major version. Each minor version might have some breaking changes to the cadl language, library API or both. Those are documented [here]({%doc "release-notes"%}).

Every change to the `main` branch is automatically published under the npm `@next` tag.

## Current packages

| Name                                            | Changelog                    | Latest                                                                                                                             | Next                                                                   |
| ----------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Core functionality                              |                              |                                                                                                                                    |                                                                        |
| [@cadl-lang/compiler][compiler_src]             | [Changelog][compiler_chg]    | [![](https://img.shields.io/npm/v/@cadl-lang/compiler)](https://www.npmjs.com/package/@cadl-lang/compiler)                         | ![](https://img.shields.io/npm/v/@cadl-lang/compiler/next)             |
| Cadl Libraries                                  |                              |                                                                                                                                    |                                                                        |
| [@cadl-lang/rest][rest_src]                     | [Changelog][rest_chg]        | [![](https://img.shields.io/npm/v/@cadl-lang/rest)](https://www.npmjs.com/package/@cadl-lang/rest)                                 | ![](https://img.shields.io/npm/v/@cadl-lang/rest/next)                 |
| [@cadl-lang/openapi][openapi_src]               | [Changelog][openapi_chg]     | [![](https://img.shields.io/npm/v/@cadl-lang/openapi)](https://www.npmjs.com/package/@cadl-lang/openapi)                           | ![](https://img.shields.io/npm/v/@cadl-lang/openapi/next)              |
| [@cadl-lang/openapi3][openapi3_src]             | [Changelog][openapi3_chg]    | [![](https://img.shields.io/npm/v/@cadl-lang/openapi3)](https://www.npmjs.com/package/@cadl-lang/openapi3)                         | ![](https://img.shields.io/npm/v/@cadl-lang/openapi3/next)             |
| [@cadl-lang/versioning][versioning_src]         | [Changelog][versioning_chg]  | [![](https://img.shields.io/npm/v/@cadl-lang/versioning)](https://www.npmjs.com/package/@cadl-lang/versioning)                     | ![](https://img.shields.io/npm/v/@cadl-lang/versioning/next)           |
| Cadl Tools                                      |                              |                                                                                                                                    |                                                                        |
| [@cadl-lang/prettier-plugin-cadl][prettier_src] | [Changelog][prettier_chg]    | [![](https://img.shields.io/npm/v/@cadl-lang/prettier-plugin-cadl)](https://www.npmjs.com/package/@cadl-lang/prettier-plugin-cadl) | ![](https://img.shields.io/npm/v/@cadl-lang/prettier-plugin-cadl/next) |
| [cadl-vs][cadl-vs_src]                          | [Changelog][cadl-vs_chg]     | [![](https://img.shields.io/npm/v/cadl-vs)](https://www.npmjs.com/package/cadl-vs)                                                 | ![](https://img.shields.io/npm/v/cadl-vs/next)                         |
| [cadl-vscode][cadl-vscode_src]                  | [Changelog][cadl-vscode_chg] | [![](https://img.shields.io/npm/v/cadl-vscode)](https://www.npmjs.com/package/cadl-vscode)                                         | ![](https://img.shields.io/npm/v/cadl-vscode/next)                     |
| [tmlanguage-generator][tmlanguage_src]          | [Changelog][tmlanguage_chg]  | [![](https://img.shields.io/npm/v/tmlanguage-generator)](https://www.npmjs.com/package/tmlanguage-generator)                       | ![](https://img.shields.io/npm/v/tmlanguage-generator/next)            |

[compiler_src]: packages/compiler
[compiler_chg]: packages/compiler/CHANGELOG.md
[rest_src]: packages/rest
[rest_chg]: packages/rest/CHANGELOG.md
[openapi_src]: packages/openapi
[openapi_chg]: packages/openapi/CHANGELOG.md
[openapi3_src]: packages/openapi3
[openapi3_chg]: packages/openapi3/CHANGELOG.md
[versioning_src]: packages/versioning
[versioning_chg]: packages/versioning/CHANGELOG.md
[prettier_src]: packages/prettier-plugin-cadl
[prettier_chg]: packages/prettier-plugin-cadl/CHANGELOG.md
[cadl-vs_src]: packages/cadl-vs
[cadl-vs_chg]: packages/cadl-vs/CHANGELOG.md
[cadl-vscode_src]: packages/cadl-vscode
[cadl-vscode_chg]: packages/cadl-vscode/CHANGELOG.md
[tmlanguage_src]: packages/tmlanguage-generator
[tmlanguage_chg]: packages/tmlanguage-generator/CHANGELOG.md

## Release cadence

We release changes from all packages the first week of every month.

You can look at the millestones https://github.com/microsoft/cadl/milestones to see upcoming changes. Millestones are named after the target release month (i.e `[2022] October` is the sprint running in september targeting a release in the first week of October.)

## Breaking changes migration guides

Release notes describing the breaking changes and how to migrate can be found in this folder:

[https://github.com/microsoft/cadl/tree/main/docs/release](https://github.com/microsoft/cadl/tree/main/docs/release)
