# Change Log - @typespec/http-client-python

## 0.3.11

### Other Changes

- Pad special property name in model to avoid conflict

### Bug Fixes

- Fix crash if no valid client define in typespec file

## 0.3.10

### Bug Fixes

- Bump pyright and mypy dependencies

## 0.3.9

### Bug Fixes

- Fix quote for string type

## 0.3.8

### Bug Fixes

- Fix access for paging operation and lro

## 0.3.7

### Bug Fixes

- Update dependencies to fix install

## 0.3.6

### Bump dependencies

- Bump `@typespec/*` 0.62.0 and `@azure-tools/*` 0.48.0

## 0.3.5

### Bump dependencies

- Bump TCGC to 0.47.4

## 0.3.4

### Bug Fixes

- Added ignore comment in `__init__.py` to avoid mypy error

## 0.3.3

### Bug Fixes

- Fix pylint issue for useless suppressions

## 0.3.2

### Bug Fixes

- Update generated code so there is no need to run the `postprocess` script when customizations are made #4718

## 0.3.1

### Bug Fixes

- Avoid change original data when deserialize for polymorphic model

## 0.3.0

### Bump dependencies

- Bump dependencies

### Bug Fixes

- Fix CI to make sure generated SDK pass necessary check

## 0.2.0

### Bug Fixes

- Fix lint issues

### Features

- Removed usage for some deprecated function of `@azure-tools/typespec-client-generator-core`

## 0.1.0

### Features

- Initial release
