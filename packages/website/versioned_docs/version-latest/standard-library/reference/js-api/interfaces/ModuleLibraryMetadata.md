---
jsApi: true
title: "[I] ModuleLibraryMetadata"

---
Data for a library. Either loaded via a node_modules package or a standalone js file

## Extends

- `LibraryMetadataBase`

## Properties

| Property | Modifier | Type | Description | Inherited from |
| :------ | :------ | :------ | :------ | :------ |
| `bugs?` | `public` | `object` | - | `LibraryMetadataBase.bugs` |
| `bugs.url?` | `public` | `string` | Url where to file bugs for this library. | - |
| `homepage?` | `readonly` | `string` | Library homepage. | `LibraryMetadataBase.homepage` |
| `name` | `readonly` | `string` | Library name as specified in the package.json or in exported $lib. | - |
| `type` | `public` | `"module"` | - | - |
| `version?` | `public` | `string` | Library version | `LibraryMetadataBase.version` |
