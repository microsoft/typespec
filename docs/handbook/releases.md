---
id: releases
title: Releases
---

## Versioning strategy for packages

TypeSpec is currently in its development phase, and all packages are released with a `0.` major version. Each minor version may introduce some breaking changes to the TypeSpec language, library API, or both. These changes are documented [here](../release-notes).

Any modification to the `main` branch is automatically published under the npm `@next` tag.

## Available packages

| Name                                               | Changelog                        | Latest                                                                                                                                              | Next                                                                      |
| -------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Core functionality                                 |                                  |                                                                                                                                                     |                                                                           |
| [@typespec/compiler][compiler_src]                 | [Changelog][compiler_chg]        | [![Npm version](https://img.shields.io/npm/v/@typespec/compiler)](https://www.npmjs.com/package/@typespec/compiler)                                 | ![](https://img.shields.io/npm/v/@typespec/compiler/next)                 |
| TypeSpec Libraries                                 |                                  |                                                                                                                                                     |                                                                           |
| [@typespec/rest][rest_src]                         | [Changelog][rest_chg]            | [![Npm version](https://img.shields.io/npm/v/@typespec/rest)](https://www.npmjs.com/package/@typespec/rest)                                         | ![](https://img.shields.io/npm/v/@typespec/rest/next)                     |
| [@typespec/openapi][openapi_src]                   | [Changelog][openapi_chg]         | [![Npm version](https://img.shields.io/npm/v/@typespec/openapi)](https://www.npmjs.com/package/@typespec/openapi)                                   | ![](https://img.shields.io/npm/v/@typespec/openapi/next)                  |
| [@typespec/openapi3][openapi3_src]                 | [Changelog][openapi3_chg]        | [![Npm version](https://img.shields.io/npm/v/@typespec/openapi3)](https://www.npmjs.com/package/@typespec/openapi3)                                 | ![](https://img.shields.io/npm/v/@typespec/openapi3/next)                 |
| [@typespec/versioning][versioning_src]             | [Changelog][versioning_chg]      | [![Npm version](https://img.shields.io/npm/v/@typespec/versioning)](https://www.npmjs.com/package/@typespec/versioning)                             | ![](https://img.shields.io/npm/v/@typespec/versioning/next)               |
| TypeSpec Tools                                     |                                  |                                                                                                                                                     |                                                                           |
| [@typespec/prettier-plugin-typespec][prettier_src] | [Changelog][prettier_chg]        | [![Npm version](https://img.shields.io/npm/v/@typespec/prettier-plugin-typespec)](https://www.npmjs.com/package/@typespec/prettier-plugin-typespec) | ![](https://img.shields.io/npm/v/@typespec/prettier-plugin-typespec/next) |
| [typespec-vs][typespec-vs_src]                     | [Changelog][typespec-vs_chg]     | [![Npm version](https://img.shields.io/npm/v/typespec-vs)](https://www.npmjs.com/package/typespec-vs)                                               | ![](https://img.shields.io/npm/v/typespec-vs/next)                        |
| [typespec-vscode][typespec-vscode_src]             | [Changelog][typespec-vscode_chg] | [![Npm version](https://img.shields.io/npm/v/typespec-vscode)](https://www.npmjs.com/package/typespec-vscode)                                       | ![](https://img.shields.io/npm/v/typespec-vscode/next)                    |
| [tmlanguage-generator][tmlanguage_src]             | [Changelog][tmlanguage_chg]      | [![Npm version](https://img.shields.io/npm/v/tmlanguage-generator)](https://www.npmjs.com/package/tmlanguage-generator)                             | ![](https://img.shields.io/npm/v/tmlanguage-generator/next)               |

[compiler_src]: https://github.com/microsoft/typespec/blob/main/packages/compiler
[compiler_chg]: https://github.com/microsoft/typespec/blob/main/packages/compiler/CHANGELOG.md
[rest_src]: https://github.com/microsoft/typespec/blob/main/packages/rest
[rest_chg]: https://github.com/microsoft/typespec/blob/main/packages/rest/CHANGELOG.md
[openapi_src]: https://github.com/microsoft/typespec/blob/main/packages/openapi
[openapi_chg]: https://github.com/microsoft/typespec/blob/main/packages/openapi/CHANGELOG.md
[openapi3_src]: https://github.com/microsoft/typespec/blob/main/packages/openapi3
[openapi3_chg]: https://github.com/microsoft/typespec/blob/main/packages/openapi3/CHANGELOG.md
[versioning_src]: https://github.com/microsoft/typespec/blob/main/packages/versioning
[versioning_chg]: https://github.com/microsoft/typespec/blob/main/packages/versioning/CHANGELOG.md
[prettier_src]: https://github.com/microsoft/typespec/blob/main/packages/prettier-plugin-typespec
[prettier_chg]: https://github.com/microsoft/typespec/blob/main/packages/prettier-plugin-typespec/CHANGELOG.md
[typespec-vs_src]: https://github.com/microsoft/typespec/blob/main/packages/typespec-vs
[typespec-vs_chg]: https://github.com/microsoft/typespec/blob/main/packages/typespec-vs/CHANGELOG.md
[typespec-vscode_src]: https://github.com/microsoft/typespec/blob/main/packages/typespec-vscode
[typespec-vscode_chg]: https://github.com/microsoft/typespec/blob/main/packages/typespec-vscode/CHANGELOG.md
[tmlanguage_src]: https://github.com/microsoft/typespec/blob/main/packages/tmlanguage-generator
[tmlanguage_chg]: https://github.com/microsoft/typespec/blob/main/packages/tmlanguage-generator/CHANGELOG.md

## Release cadence

We roll out updates for all packages during the first week of each month.

To preview upcoming changes, you can check the milestones at https://github.com/microsoft/typespec/milestones. Milestones are labeled according to the target release month.

## Breaking changes migration guides

Release notes describing the breaking changes and how to migrate can be found in this folder:

[https://github.com/microsoft/typespec/tree/main/docs/release-notes](https://github.com/microsoft/typespec/tree/main/docs/release-notes)
