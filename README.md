# TypeSpec

[Try TypeSpec Online](https://aka.ms/trytypespec)

TypeSpec is a language for describing cloud service APIs and generating other API
description languages, client and service code, documentation, and other assets.
TypeSpec provides highly extensible core language primitives that can describe API
shapes common among REST, OpenAPI, GraphQL, gRPC, and other protocols.

Using TypeSpec, you can create reusable patterns for all aspects of an API, along with the ability to check for and flag known anti-patterns. These patterns establish "guardrails" for API designers and make it easier to follow best practices than deviate from them. TypeSpec promotes highly regular API designs that adhere to best practices by construction.

You can try a work-in-progress build of the compiler by following the steps in
the Getting Started section below. Please feel free to [file
issues](https://github.com/Microsoft/typespec/issues) for any issues you encounter while
using the preview.

## Try TypeSpec without installing anything

You can try TypeSpec on the web without installing anything.

- [TypeSpec playground](https://cadlplayground.z22.web.core.windows.net)
- [TypeSpec playground for Azure services](https://cadlplayground.z22.web.core.windows.net/typespec-azure/)

## Getting Started

For documentation for TypeSpec language, see https://microsoft.github.io/typespec.

### Using Docker

[See docker documentation](./docker)

### Using Node & Npm

#### One-time Setup

1. Install [Node.js 16 LTS](https://nodejs.org/en/download/) and ensure you are able to run the `npm` command in a command prompt:

   ```bash
   npm --version
   ```

   It is recommended to have npm 7+. To update npm run `npm install -g npm`

2. Install TypeSpec compiler and libraries:

```bash
   npm init -y
   npm install -g @typespec/compiler
```

If you do not wish to install the compiler globally with `-g` flag, you will need to install it locally once in every TypeSpec project folder. You would also need to prefix every TypeSpec run command with `npx`. See [npx documentation](https://docs.npmjs.com/cli/v7/commands/npx)

```bash
    npx tsp init
    npx tsp compile
```

3. Install the TypeSpec extension for your editor of choice:

   - [Instructions for Visual Studio](#installing-visual-studio-extension)
   - [Instructions for Visual Studio Code](#installing-vs-code-extension)

### Creating TypeSpec project

1. Create a folder for your new TypeSpec project

2. Initialize a TypeSpec project.

   - Run `tsp init` > Select `Generic Rest API` template with `@typespec/rest` and `@typespec/openapi3` libraries checked.
   - Run `tsp install` to install node package dependencies.

3. Open the folder in your editor and edit `main.tsp`

4. Follow our [documentation](https://microsoft.github.io/typespec) to get started writing TypeSpec!

5. Once you're ready to compile your TypeSpec to Swagger, save the file and type this at the command prompt in your project folder:

   ```bash
   tsp compile .
   ```

   This will compile the TypeSpec files in the project folder into one output file: `.\tsp-output\openapi.json`.

## Troubleshooting

[See common issues here](./troubleshooting.md)

## Usage

See full usage documentation by typing:

```
tsp --help
```

### Compiling TypeSpec source to an OpenAPI 3.0 specification

Here is a very small TypeSpec example that uses the `@typespec/openapi3` library to generate OpenAPI 3.0 from TypeSpec.

#### sample.tsp

```typespec
import "@typespec/http";

using TypeSpec.Http;

@server("https://example.com", "Single server endpoint")
@route("/example")
namespace Example {
  @get
  @route("/message")
  op getMessage(): string;
}
```

You can compile it to OpenAPI 3.0 by using the following command:

```
tsp compile sample.tsp --emit @typespec/openapi3
```

Once it compiles, you can find the emitted OpenAPI document in `./tsp-output/openapi.json.

You can also pass in a directory instead of a file to `tsp compile`. That's
equivalent to passing `main.tsp` in that directory.

### Formatting TypeSpec files

TypeSpec provides an auto-formatter to keep your specs clean and organized.
`node_modules` folders are automatically excluded by default

```bash
tsp format <patterns...>

# Format all the files in the current directory with the typespec extension.
tsp format **/*.tsp

# Exclude certain patterns. Either use `!` prefix or pass it via the `--exclude` or `-x` option.
tsp format **/*.tsp "!my-test-folder/**/*"
tsp format **/*.tsp --exclude "my-test-folder/**/*"
```

### Installing VS Code Extension

```
tsp code install
```

This will download and install the latest VS Code extension. Use `tsp code uninstall` to remove it. Pass `--insiders` if you use VS Code Insiders edition.

If `tsp-server` cannot be found on PATH by VS Code in your setup, you can
configure its location in VS Code settings. Search for "TypeSpec" in File ->
Preferences -> Settings, and adjust `typespec.tsp-server.path` accordingly. You may
need to restart VS Code after changing this. This should be the path to the `@typespec/compiler` package. (e.g. `./node_modules/@typespec/compiler`)

You can also configure a project to use a local npm install of
`@typespec/compiler`. See [local-typespec sample](packages/samples/local-typespec).

### Installing Visual Studio Extension

```
tsp vs install
```

This will download and install the latest Visual Studio extension. Use `tsp vs uninstall` to remove it.

If `tsp-server` cannot be found on PATH by Visual Studio in your setup, you can
configure its location by setting up the `typespec.tsp-server.path` entry in `.vs/VSWorkspaceSettings.json`. You may need to restart Visual Studio after changing this.
This should be the path to the `@typespec/compiler` package. (e.g. `./node_modules/@typespec/compiler`)

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
