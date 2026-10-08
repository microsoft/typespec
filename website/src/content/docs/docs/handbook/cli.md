---
id: cli
title: Cli usage
---

See full usage documentation by typing `tsp --help`:

:::warning
When using `tsp init` with an external template URL, be aware that downloading or using an untrusted template may contain malicious packages that can compromise your system and data. Proceed with caution and verify the source.
:::

```bash
>tsp --help
TypeSpec compiler v0.36.1

tsp <command>

Commands:
  tsp compile <path>       Compile TypeSpec source.
  tsp code                 Manage VS Code Extension.
  tsp vs                   Manage Visual Studio Extension.
  tsp format <include...>  Format given list of TypeSpec files.
  tsp init [templatesUrl]  Create a new TypeSpec project.
  tsp install              Install TypeSpec dependencies
  tsp info                 Show information about the current TypeSpec compiler.

Options:
  --help     Show help                                                 [boolean]
  --debug    Output debug log messages.               [boolean] [default: false]
  --pretty   Enable color and formatting in TypeSpec's output to make compiler error
             s easier to read.                         [boolean] [default: true]
  --version  Show version number                                       [boolean]
```

## Environment Variables

### `TYPESPEC_NPM_REGISTRY`

Set the npm-compatible registry URL used by `tsp init` when resolving package versions and by `tsp install` when downloading the configured package manager. This is useful in corporate environments where a private registry is required.

```bash
TYPESPEC_NPM_REGISTRY=https://my-corp-registry.example.com tsp init
```

If this variable is not set, TypeSpec defaults to `https://registry.npmjs.org`.

This variable does not configure the package manager invoked by `tsp init` or `tsp install`.
Configure that package manager separately using its own registry and authentication settings.
TypeSpec does not read those authentication settings: its package metadata request and the tarball
URL returned by the registry must be accessible to the TypeSpec process, using
`TYPESPEC_NPM_REGISTRY_TOKEN` if authentication is required.

### `TYPESPEC_NPM_REGISTRY_TOKEN`

Set a bearer token to authenticate TypeSpec's package metadata requests and package-manager
downloads against the registry selected by `TYPESPEC_NPM_REGISTRY`. If no registry is configured,
the token applies to the default npm registry.

TypeSpec only sends the token to URLs with the same origin and within the configured registry's
path. It does not send the token to tarballs hosted on other origins or outside that path.

Supply this variable through your environment or CI secret settings; do not commit tokens to
source control. This variable does not configure authentication for the invoked package manager,
which still uses its own authentication settings.
