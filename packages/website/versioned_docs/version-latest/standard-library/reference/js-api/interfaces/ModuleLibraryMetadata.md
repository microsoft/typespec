---
jsApi: true
title: "[I] ModuleLibraryMetadata"

---
Data for a library. Either loaded via a node_modules package or a standalone js file

## Extends

- `LibraryMetadataBase`

## Properties

| Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ |
| `bugs?` | `object` | - | LibraryMetadataBase.bugs |
| `bugs.url?` | `string` | Url where to file bugs for this library. | - |
| `homepage?` | `string` | Library homepage. | LibraryMetadataBase.homepage |
| `name` | `string` | Library name as specified in the package.json or in exported $lib. | - |
| `type` | `"module"` | - | - |
| `version?` | `string` | Library version | LibraryMetadataBase.version |
