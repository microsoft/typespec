# TypeSpec

[Official Docs](https://typespec.io/) | [Try TypeSpec Online](https://aka.ms/trytypespec) | [Getting Started](https://typespec.io/docs) | [Language Overview](https://typespec.io/docs/language-basics/overview)

TypeSpec is a language for defining cloud service APIs and shapes. TypeSpec is a highly extensible language with primitives that can describe API shapes common among REST, OpenAPI, gRPC, and other protocols.

TypeSpec is excellent for generating many different API description formats, client and service code, documentation, and other assets while keeping your TypeSpec definition as a single source of truth.

Using TypeSpec, you can create reusable patterns for all aspects of an API and package those reusable patterns into libraries. These patterns establish "guardrails" for API designers and make it easier to follow best practices than to deviate from them. TypeSpec also has a rich linter framework with the ability to flag anti-patterns as well as an emitter framework that lets you control the output to ensure it follows the patterns you want.

## [Installation](https://typespec.io/docs)

```
npm install -g @typespec/compiler
```

#### Tools

The [TypeSpec VS Code extension](https://marketplace.visualstudio.com/items?itemName=typespec.typespec-vscode) can be installed from the VS Code [marketplace](https://marketplace.visualstudio.com/items?itemName=typespec.typespec-vscode) or directly on the command line:

```
tsp code install
```

The [TypeSpec VS Extension](https://marketplace.visualstudio.com/items?itemName=typespec.typespecvs) can be installed from the [VS Marketplace](https://marketplace.visualstudio.com/items?itemName=typespec.typespecvs) or directly on the command line:

```
tsp vs install
```

## [Usage](https://typespec.io/docs#create-first-typespec-project)

### TypeSpec to OpenAPI 3.0 Example

This example uses the `@typespec/http`, `@typespec/rest`, and `@typespec/openapi3` libraries to define a basic REST service and generate an OpenAPI 3.0 document from it.

Run the following command and select "Generic REST API":

```
tsp init
```

Hit enter a few times to confirm the defaults.

Copy the contents below into your **main.tsp**:

```typespec
import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

using Http;
using Rest;

/** This is a pet store service. */
@service(#{ title: "Pet Store Service" })
@server("https://example.com", "The service endpoint")
namespace PetStore;

@route("/pets")
interface Pets {
  list(): Pet[];
}

model Pet {
  @minLength(100)
  name: string;

  @minValue(0)
  @maxValue(100)
  age: int32;

  kind: "dog" | "cat" | "fish";
}
```

Install the dependencies of main.tsp:

```
tsp install
```

Compile it to OpenAPI 3.0:

```
tsp compile main.tsp --emit @typespec/openapi3
```

You can find the emitted OpenAPI output in `./tsp-output/openapi.json`.

## Advanced Scenarios

### Installing nightly version

On every commit to the main branch, packages with changes are automatically published to npm with the `@next` tag.
The [packages](#packages) section shows which version corresponds to the `next` tag for each package.

To use a `nightly` version of the packages, go over each one of the packages in the `package.json` file and update it to either the latest published `@next` version or `@latest`, whichever is the newest. You can also use the tag `latest` or `next` instead of an explicit version.

After updating the package.json file you can run `npm update --force`. Force is required as there might be some incompatible version requirement.

Example

```json5
// Stable setup
"dependencies": {
  "@typespec/compiler": "~0.30.0",
  "@typespec/http": "~0.14.0",
  "@typespec/rest": "~0.14.0",
  "@typespec/openapi": "~0.9.0",
}

// Consume next version
// In this example: compiler and openapi have changes but rest library has none
"dependencies": {
  "@typespec/compiler": "~0.31.0-dev.5",
  "@typespec/http": "~0.14.0",
  "@typespec/rest": "~0.14.0", // No changes to @typespec/rest library so need to stay the latest.
  "@typespec/openapi": "~0.10.0-dev.2",
}
```

## Packages

| Name                                               | Changelog                        | Latest                                                                                                                                   | Next                                                                      |
| -------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Core functionality                                 |                                  |                                                                                                                                          |                                                                           |
| [@typespec/compiler][compiler_src]                 | [Changelog][compiler_chg]        | [![](https://img.shields.io/npm/v/@typespec/compiler)](https://www.npmjs.com/package/@typespec/compiler)                                 | ![](https://img.shields.io/npm/v/@typespec/compiler/next)                 |
| TypeSpec Libraries                                 |                                  |                                                                                                                                          |                                                                           |
| [@typespec/http][http_src]                         | [Changelog][http_chg]            | [![](https://img.shields.io/npm/v/@typespec/http)](https://www.npmjs.com/package/@typespec/http)                                         | ![](https://img.shields.io/npm/v/@typespec/http/next)                     |
| [@typespec/rest][rest_src]                         | [Changelog][rest_chg]            | [![](https://img.shields.io/npm/v/@typespec/rest)](https://www.npmjs.com/package/@typespec/rest)                                         | ![](https://img.shields.io/npm/v/@typespec/rest/next)                     |
| [@typespec/openapi][openapi_src]                   | [Changelog][openapi_chg]         | [![](https://img.shields.io/npm/v/@typespec/openapi)](https://www.npmjs.com/package/@typespec/openapi)                                   | ![](https://img.shields.io/npm/v/@typespec/openapi/next)                  |
| [@typespec/openapi3][openapi3_src]                 | [Changelog][openapi3_chg]        | [![](https://img.shields.io/npm/v/@typespec/openapi3)](https://www.npmjs.com/package/@typespec/openapi3)                                 | ![](https://img.shields.io/npm/v/@typespec/openapi3/next)                 |
| [@typespec/versioning][versioning_src]             | [Changelog][versioning_chg]      | [![](https://img.shields.io/npm/v/@typespec/versioning)](https://www.npmjs.com/package/@typespec/versioning)                             | ![](https://img.shields.io/npm/v/@typespec/versioning/next)               |
| TypeSpec Tools                                     |                                  |                                                                                                                                          |                                                                           |
| [@typespec/prettier-plugin-typespec][prettier_src] | [Changelog][prettier_chg]        | [![](https://img.shields.io/npm/v/@typespec/prettier-plugin-typespec)](https://www.npmjs.com/package/@typespec/prettier-plugin-typespec) | ![](https://img.shields.io/npm/v/@typespec/prettier-plugin-typespec/next) |
| [typespec-vs][typespec-vs_src]                     | [Changelog][typespec-vs_chg]     | [![](https://img.shields.io/npm/v/typespec-vs)](https://www.npmjs.com/package/typespec-vs)                                               | ![](https://img.shields.io/npm/v/typespec-vs/next)                        |
| [typespec-vscode][typespec-vscode_src]             | [Changelog][typespec-vscode_chg] | [![](https://img.shields.io/npm/v/typespec-vscode)](https://www.npmjs.com/package/typespec-vscode)                                       | ![](https://img.shields.io/npm/v/typespec-vscode/next)                    |
| [tmlanguage-generator][tmlanguage_src]             | [Changelog][tmlanguage_chg]      | [![](https://img.shields.io/npm/v/tmlanguage-generator)](https://www.npmjs.com/package/tmlanguage-generator)                             | ![](https://img.shields.io/npm/v/tmlanguage-generator/next)               |

[compiler_src]: packages/compiler
[compiler_chg]: packages/compiler/CHANGELOG.md
[http_src]: packages/http
[http_chg]: packages/http/CHANGELOG.md
[rest_src]: packages/rest
[rest_chg]: packages/rest/CHANGELOG.md
[openapi_src]: packages/openapi
[openapi_chg]: packages/openapi/CHANGELOG.md
[openapi3_src]: packages/openapi3
[openapi3_chg]: packages/openapi3/CHANGELOG.md
[versioning_src]: packages/versioning
[versioning_chg]: packages/versioning/CHANGELOG.md
[prettier_src]: packages/prettier-plugin-typespec
[prettier_chg]: packages/prettier-plugin-typespec/CHANGELOG.md
[typespec-vs_src]: packages/typespec-vs
[typespec-vs_chg]: packages/typespec-vs/CHANGELOG.md
[typespec-vscode_src]: packages/typespec-vscode
[typespec-vscode_chg]: packages/typespec-vscode/CHANGELOG.md
[tmlanguage_src]: packages/tmlanguage-generator
[tmlanguage_chg]: packages/tmlanguage-generator/CHANGELOG.md

`@next` version of the package are the latest versions available on the `main` branch.
