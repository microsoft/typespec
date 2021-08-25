# Cadl

Cadl is a language for describing cloud service APIs and generating other API
description languages, client and service code, documentation, and other assets.
Cadl provides highly extensible core language primitives that can describe API
shapes common among REST, GraphQL, gRPC, and other protocols.

You can try a work-in-progress build of the compiler by following the steps in
the Getting Started section below. Please feel free to [file
issues](https://github.com/Azure/adl/issues) for any issues you encounter while
using the preview.

## Packages

| Name                                        | Changelog                    | Latest                                                     |
| ------------------------------------------- | ---------------------------- | ---------------------------------------------------------- |
| Core functionality                          |
| [@cadl-lang/compiler][cadl_src]                 | [Changelog][cadl_chg]         | ![](https://img.shields.io/npm/v/@cadl-lang/compiler)         |
| Cadl Libraries                               |
| [@cadl-lang/rest][rest_src]       | [Changelog][rest_chg]    | ![](https://img.shields.io/npm/v/@cadl-lang/rest)    |
| [@cadl-lang/openapi3][openapi3_src] | [Changelog][openapi3_chg] | ![](https://img.shields.io/npm/v/@cadl-lang/openapi3) |
| Cadl Tools                                   |
| [cadl-vs][cadl-vs_src]           | [Changelog][cadl-vs_chg]      | ![](https://img.shields.io/npm/v/@azure-tools/cadl-vs)      |
| [cadl-vscode][cadl-vscode_src]   | [Changelog][cadl-vscode_chg]  | ![](https://img.shields.io/npm/v/cadl-vscode)               |

[cadl_src]: packages/compiler
[cadl_chg]: packages/compiler/CHANGELOG.md
[rest_src]: packages/rest
[rest_chg]: packages/rest/CHANGELOG.md
[openapi3_src]: packages/openapi3
[openapi3_chg]: packages/openapi3/CHANGELOG.md
[cadl-vs_src]: packages/cadl-vs
[cadl-vs_chg]: packages/cadl-vs/CHANGELOG.md
[cadl-vscode_src]: packages/cadl-vscode
[cadl-vscode_chg]: packages/cadl-vscode/CHANGELOG.md

## Getting Started

1. Install [Node.js 14 LTS](https://nodejs.org/en/download/) and ensure you are able to run the `npm` command in a command prompt:

   ```
   npm --version
   ```

2. Create a folder for your new Cadl project

3. In a command prompt, run the following commands:

   ```
   cd path\to\cadl\project
   npm init -y
   npm install -g @cadl-lang/compiler
   npm install @cadl-lang/rest @cadl-lang/openapi3
   ```

   This will create a `package.json` file for your Cadl project and add the necessary Cadl dependencies to it.

4. Install the Cadl extension for your editor of choice:

   - [Instructions for Visual Studio](#installing-visual-studio-extension)
   - [Instructions for Visual Studio Code](#installing-vs-code-extension)

5. Open the folder in your editor and create a new file with a `.cadl` extension

6. [Follow our tutorial](docs/tutorial.md) to get started writing Cadl!

7. Once you're ready to compile your Cadl to Swagger, save the file and type this at the command prompt in your project folder:

   ```
   npx cadl compile .
   ```

   This will compile the Cadl files in the project folder into one output file: `.\cadl-output\openapi.json`.


## Usage

See full usage documentation by typing:

```
cadl --help
```

You can launch Cadl in one of two ways:

### Compiling a folder of Cadl files to an OpenAPI 2.0 (Swagger) specification

You can compile a folder containing `.cadl` files into a single OpenAPI document by
using the following command:

```
cadl compile samples/petstore/
```

You can now examine the emitted OpenAPI document in `./cadl-output/openapi.json`.

### Formatting Cadl files

Cadl provides an auto-formatter to keep your specs clean and organized.

```bash
cadl format <patterns...>

# Format all the files in the current directory with the cadl extension.
cadl format **/*.cadl
```

### Installing VS Code Extension

```
cadl code install
```

This will download and install the latest VS Code extension. Use `cadl code uninstall` to remove it. Pass `--insiders` if you use VS Code Insiders edition.

If `cadl-server` cannot be found on PATH by VS Code in your setup, you can
configure its location in VS Code settings. Search for "Cadl" in File ->
Preferences -> Settings, and adjust `cadl.cadl-server.path` accordingly. You may
need to restart VS Code after changing this.

You can also configure a project to use a local npm install of
`@cadl-lang/compiler`. See [local-cadl sample](packages/cadl-samples/local-cadl).

### Installing Visual Studio Extension

```
cadl vs install
```

This will download and install the latest Visual Studio extension. Use `cadl vs uninstall` to remove it.
