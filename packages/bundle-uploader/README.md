# Playground bundle uploader

Internal tooling for publishing TypeSpec package bundles to Playground storage.
By default, uploads skip package versions and assets that already exist.

To replace an incorrectly published package version without deleting its blobs manually,
run the core upload command with `--overwrite`:

```sh
node eng/tsp-core/scripts/upload-bundler-packages.ts --overwrite
```

The publish pipeline exposes the same opt-in behavior through the
**Overwrite existing Playground package versions** parameter, which defaults to `false`.

Standalone packages can also be replaced with:

```sh
node eng/emitters/scripts/upload-bundled-emitter.ts path/to/package --overwrite
```

Overwrite mode replaces the manifest, JavaScript files, static assets, and bundled peer
dependencies for the uploaded versions. Both `bundleAndUploadPackages` and
`bundleAndUploadStandalonePackage` accept an optional `overwrite: true` setting.

The shared index also removes obsolete export mappings for successfully overwritten
packages, while preserving mappings for other packages.
