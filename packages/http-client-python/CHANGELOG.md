# Change Log - @typespec/http-client-python

## 0.6.9

### Bug Fixes

- Fix output folder of models when output folder is different with namespace in configuration

## 0.6.8

### Bug Fixes

- Fix for scenario that output folder is different with namespace
- Improve XML serialization information in generated models

## 0.6.7

### Bug Fixes

- Fix sphinx typing for raising documentation
- fix typing for class methods in _serialization.py

## 0.6.6

### Other Changes

- Rename `apiview_mapping_python.json` cross-language id file to `apiview-properties.json` for cross-language compatibility
- Order keyword-only args overload first in generated operations

## 0.6.5

### Bug Fixes

- Only add type annotation during initialization for readonly
- Fix pylint issues

### Bump dependencies

- Bump `@typespec/*` 0.64.0 and `@azure-tools/*` 0.50.0

## 0.6.4

### Bug Fixes

- Fix pack issue for typespec namespace
- Fix typing issue for unbranded test case

## 0.6.3

### Bug Fixes

- Only import helpers for serialization if input body is not binary
- Unify descriptions for credentials in documentation

### Other Changes

- Add type annotations for initialized properties in msrest model inits
- Add mypy typing to operation group inits
- Remove Python2 specific datetime logic from internal serialization.

## 0.6.2

### Bug Fixes

- Don't automatically overwrite version in `_version.py` file and `setup.py` file if the existing version is newer

## 0.6.1

### Bug Fixes

- Only add linting disables for a file with too many lines if the file doesn't already disable this linter rule
- Generate `__init__` for internal models to allow for discriminator needs

## 0.6.0

### Features

- Add support for typespec namespace

### Bug Fixes

- Only add linting disables for a file with too many lines if the file doesn't already disable this linter rule

## 0.5.1

### Bug Fixes

- Do not do exception sort if there is no operation groups

## 0.5.0

### Features

- Add support for generation in enviroments without a Python installation

## 0.4.4

### Bug Fixes

- `:code:` in docstring should always be preceded by `\`

## 0.4.3

### Bump dependencies

- Bump `@typespec/*` 0.63.0 and `@azure-tools/*` 0.49.0

## 0.4.2

### Bug Fixes

- Ignore models/enum only used as LRO envelope results
- Refine exception handling logic to keep compatibility for legacy SDK

## 0.4.1

### Bug Fixes

- Ignore models only used as LRO envelope results because we don't do anything with them

## 0.4.0

### Features

- Refine exception handling logic and support exception with ranged status code (#5270)

### Bug Fixes

- Filter out credential that python does not support for now (#5282)

## 0.3.12

### Other Changes

- Fix `useless-object-inheritance` pylint errors

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
