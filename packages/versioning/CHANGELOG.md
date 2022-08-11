# Change Log - @cadl-lang/versioning

This log was last generated on Thu, 11 Aug 2022 19:05:23 GMT and should not be manually modified.

## 0.7.0
Thu, 11 Aug 2022 19:05:23 GMT

### Minor changes

- Internal: Uptake new compiler helpers to work with template types

### Patches

- Fix: Versioning when non-versioned library has template with spread.
- Fix: Versioning when multiple service versions consume the same library version.

## 0.6.1
Fri, 08 Jul 2022 23:22:57 GMT

_Version update only_

## 0.6.0
Mon, 13 Jun 2022 23:42:28 GMT

### Minor changes

- Uptake changes to decorator context
- Add ability to use @renamedFrom on Models, Operations, Interface, Unions and Enums.
- Add validation for incompatible versioning across references
- Moved all decorators and functions to `Cadl.Versioning` namespace
- **Breaking Change** Version must be defined using an enum and referenced using enums

## 0.5.0
Fri, 06 May 2022 17:19:57 GMT

### Minor changes

- Uptake `mixes` -> `extends` rename
- Fix issues with spreading versioned model
- Remove node 14 support
- Updated versioning data getter to return `undefined` instead of `-1`

### Patches

- Fix issue with versioning of operation parameters in interfaces
- Fix: Using versioned lib validation false positive with interfaces and unions

## 0.4.0
Thu, 31 Mar 2022 17:10:49 GMT

### Minor changes

- Add validation when using versioned library without @versionedDependency
- Enable ability to pick a specific version for a versioned dependency when service itself isn't versioned

## 0.3.2
Wed, 09 Mar 2022 17:42:09 GMT

_Version update only_

## 0.3.1
Tue, 15 Feb 2022 22:35:02 GMT

_Version update only_

## 0.3.0
Mon, 14 Feb 2022 03:01:08 GMT

### Minor changes

- Update decorators to take in api change

### Patches

- Bump dependency versions

## 0.2.0
Fri, 04 Feb 2022 18:00:18 GMT

### Minor changes

- Add versioning framework

