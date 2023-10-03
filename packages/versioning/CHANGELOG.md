# Change Log - @typespec/versioning

This log was last generated on Tue, 12 Sep 2023 21:47:11 GMT and should not be manually modified.

## 0.48.0
Tue, 12 Sep 2023 21:47:11 GMT

### Updates

- Fixed issue with `@typeChangedFrom` complaining about incorrect versioned references.

## 0.47.0
Tue, 08 Aug 2023 22:32:10 GMT

_Version update only_

## 0.46.0
Tue, 11 Jul 2023 22:06:00 GMT

### Updates

- Update dependencies

## 0.45.0
Tue, 06 Jun 2023 22:44:16 GMT

### Updates

- Update decorators to use `valueof`
- Update decorators signature to use `{}` instead of `object`
- Add signature for missing decorators

## 0.44.0
Wed, 10 May 2023 21:24:00 GMT

### Updates

- Fix: Crash during validation when using certain templated models from versioned library
- Update compiler to be a peer dependency
- Update dependencies
- Added validation preventing version enums from having duplicate values.
- Fix issue where "is" dependencies were not detected.
- Raise error if versioned spec specifies a single service version.

## 0.43.0
Tue, 11 Apr 2023 18:49:17 GMT

### Updates

- Fix: Issue with using version as a template parameter across different namespace. Include a significant change in the versioning library internals.
- Use pre-projections to fix issues with versioned resources.
- support new datetime types
- Removed deprecated decorator @versionedDependency and deprecated versioning helper methods: getRenamedFromVersion, getRenamedFromOldName, getAddedOn, getRemovedOn, addedAfter, removedOnOrBefore, and renamedAfter.

## 0.42.0
Mon, 13 Mar 2023 21:30:44 GMT

_Version update only_

## 0.41.0
Fri, 03 Mar 2023 19:59:17 GMT

### Updates

- Revert back changelog
- Update package.json entrypoint to tspMain
- Rename to TypeSpec
- Update homepage link

## 0.40.0
Tue, 07 Feb 2023 21:56:17 GMT

### Updates

- Adds the @useDependency decorator. Deprecates the @versionedDependency decorator.
- Ensure @renamedFrom requires a non-empty value.

## 0.39.0
Fri, 13 Jan 2023 00:05:26 GMT

### Updates

- Exporting addedOnVersions and removedOnVersions accessors.
- Added `@returnTypeChangedFrom` decorator.
- Fix issues with @added and @removed. Deprecate addedAfter and removedOnOrBefore. Added existsAtVersion.
- Ensure properties marked '@madeOptional' are actually optional.

## 0.38.0
Wed, 07 Dec 2022 17:21:52 GMT

### Minor changes

- Internal: update to use new `getTypeName` and `getNamespaceString` helper
- Deprecated getRenamedFromVersion, getRenamedFromOldName, and renamedAfter methods in favor of getRenamedFromVersions, getNameAtVersion, and hasDifferentNameAtVersion.

### Patches

- Fix: Issue with loading different version of versioning library in emitter
- Update dependencies
- Allow @renamedFrom to be used multiple times

### Updates

- Fix: Validation of versioned dependency giving false positive when inside a sub namespace of versioned namespace

## 0.10.0
Sat, 12 Nov 2022 00:14:04 GMT

### Minor changes

- Declare decorators in cadl using `extern dec`

## 0.9.0
Wed, 12 Oct 2022 21:12:35 GMT

### Minor changes

- Uptake changes to navigateProgram

## 0.8.0
Thu, 08 Sep 2022 01:04:53 GMT

### Minor changes

- Uptake change to enum members map type
- Uptake changes to compiler with current projection
- Update decororator state key to allow multiple instance of library to work together.
- React to Type suffix removal

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

### Updates

- Upgrade to TS4.7

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

