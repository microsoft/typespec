---
title: Cadl to TypeSpec rename completed in March 2023 release
---

As you may recall from our previous email to partners, we are renaming the product as it becomes more mature, stable and one step closer to release.

With the 2023-03-13 release, We are pleased to announce that we have completed the process of changing the name of our product from **Cadl** to **TypeSpec**. This marks another important milestone. The new name better aligns with the functionality and benefits of the product, and we believe it will make it easier for our customers to understand and remember.

We understand that change can be challenging, and we appreciate your patience and support during this process.

## Name Changes

- Packages:

  - NPM package scope:

    - @cadl-lang/[xx] -> @typespec/[xx]

  - Package names

| Old Package Name    | Old Namespace        | New Package Name   | New Namespace            |
| ------------------- | -------------------- | ------------------ | ------------------------ |
| @cadl-lang/compiler | using Cadl;          | @typespec/compiler | using TypeSpec;          |
| @cadl-lang/rest     | using Cadl.Http;     | @typespec/http;    | using TypeSpec.Http;     |
| @cadl-lang/rest     | using Cadl.Rest;     | @typespec/rest     | using TypeSpec.Rest;     |
| @cadl-lang/openapi  | using Cadl.OpenApi;  | @typespec/openapi  | using TypeSpec.OpenApi;  |
| @cadl-lang/openapi3 | using Cadl.OpenApi3; | @typespec/openapi3 | using TypeSpec.OpenApi3; |

- File extension:

  - `.cadl` -> `.tsp`

- Configuration file:

  - `cadl-project.yaml` -> `tspconfig.yaml`

- CLI

  - `npx cadl compile .` -> `npx tsp compile .`

- Compiler JS APIs
  - All artifacts with `*Cadl*` in the name have been updated to `*TypeSpec*`. However, aliases have been created with older `*Cadl*` name with `@deprecated` flag.
- Noteable changes:

  - @cadl-lang/rest was split into two packages, @typespec/rest and @typespec/http

- Back-compatibility
  - `.cadl` files are continue be recognized by compiler.
  - `cadl-project.yaml` is still supported if `tspconfig.yaml` not found

## Migration tool

An experimental migration tool has been introduced to take care of many of the manual migration steps. Just execute following command in your TypeSpec folder.

```bash
    npx @typespec/migrate
```

If you would like execute from a different folder or don't have a `package.json` that indicates compiler package versions, please see command line options:

```bash
     npx @typespec/migrate --help
```

The migration tool will perform following steps:

- Rename `cadl-project.yaml` to `tspconfig.yaml`.
- Update `tspconfig.yaml` format to new `emit` schema if necessary.
- Rename `.cadl` files to `.tsp`.
- Update `import` and `using` statements in any `.tsp` files
- Update `package.json` with new package name and versions.
