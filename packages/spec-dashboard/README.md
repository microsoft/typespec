# Spector Dashboard

## Dev

```bash
npm run build
```

## URL Parameters

### Show test generator

Add `?showtest=true` query parameter to url to show test generators.

Example: `http://localhost:5173/?showtest=true`

### Debug with custom manifest

Add `?debugManifest=<URL>` query parameter to load data from a custom manifest URL instead of Azure Storage.

Example: `http://localhost:5173/?debugManifest=https://example.com/my-manifest.json`

When using debug mode, a notification banner will appear indicating the custom manifest URL being used.
