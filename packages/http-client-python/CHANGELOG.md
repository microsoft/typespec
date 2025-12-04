# Change Log - @typespec/http-client-python

## 0.21.0

### Features

- [#9112](https://github.com/microsoft/typespec/pull/9112) Support customized http method to call next link for paging operation

### Bug Fixes

- [#9108](https://github.com/microsoft/typespec/pull/9108) fix logic about which scenario to add msrest as dependency
- [#9107](https://github.com/microsoft/typespec/pull/9107) Fix @override to avoid duplicated subscriptionId or api-version signatures


## 0.20.3

### Bump dependencies

- [#8992](https://github.com/microsoft/typespec/pull/8992) Bump typespec dependency

### Bug Fixes

- [#8948](https://github.com/microsoft/typespec/pull/8948) Fix subscriptionId missing for override


## 0.20.2

### Bug Fixes

- [#8905](https://github.com/microsoft/typespec/pull/8905) Avoid duplicated delete operation for autorest emitter


## 0.20.1

### Bug Fixes

- [7eda352](https://github.com/microsoft/typespec/commit/7eda3523a429568b5c713d70d45976c2676fa702) [python] add flag for clear output folder and set default to false


## 0.20.0

### Features

- [#8716](https://github.com/microsoft/typespec/pull/8716) Add logic to clear output folder

### Bug Fixes

- [#8866](https://github.com/microsoft/typespec/pull/8866) Fix bad indent
- [#8867](https://github.com/microsoft/typespec/pull/8867) Fix setting attribute of flattened property when flattened property's name is not `properties`


## 0.19.2

### Bug Fixes

- [#8720](https://github.com/microsoft/typespec/pull/8720) Fix api-version for @override
- [#8806](https://github.com/microsoft/typespec/pull/8806) Fix runtime error for constant query parameter
- [#8749](https://github.com/microsoft/typespec/pull/8749) Additional fixes to documentation with bullet points


## 0.19.1

### Bump dependencies

- [#8638](https://github.com/microsoft/typespec/pull/8638) Bump dep of `@azure-tools/typespec-client-generator-core` to hotfix `0.60.3`

### Bug Fixes

- [#8647](https://github.com/microsoft/typespec/pull/8647) Fix outputted bullet-point documentation to pass sphinx
- [#8680](https://github.com/microsoft/typespec/pull/8680) Fix indentation issue when deserializing internal error model
- [#8679](https://github.com/microsoft/typespec/pull/8679) Exclude `generated_samples` and `generated_tests` from wheel


## 0.19.0

### Features

- [#8558](https://github.com/microsoft/typespec/pull/8558) Support move method level signature to client level

### Bug Fixes

- [#8603](https://github.com/microsoft/typespec/pull/8603) support `@override` completely
- [#8607](https://github.com/microsoft/typespec/pull/8607) [python] ensure first line in param description wrap around is a space
- [#8381](https://github.com/microsoft/typespec/pull/8381) Fix bugs related to import and pylint for libraries with only internal models


## 0.18.1

### Bug Fixes

- [#8531](https://github.com/microsoft/typespec/pull/8531) [python] fix peer reps


## 0.18.0

### Features

- [#8454](https://github.com/microsoft/typespec/pull/8454) Support nested nextLink for paging operation

### Bug Fixes

- [#8516](https://github.com/microsoft/typespec/pull/8516) Add overload for operation when body type is array of model


## 0.17.0

### Features

- [#8130](https://github.com/microsoft/typespec/pull/8130) DPG model supports multi-layer discriminator.

### Bump dependencies

- [#8407](https://github.com/microsoft/typespec/pull/8407) bump tsp

### Bug Fixes

- [#8339](https://github.com/microsoft/typespec/pull/8339) fail installation when fail to create virtual environment
- [#8376](https://github.com/microsoft/typespec/pull/8376) fix black for windows os
- [#8395](https://github.com/microsoft/typespec/pull/8395) Fix line break across OS
- [#8359](https://github.com/microsoft/typespec/pull/8359) Fix import of typing `List` for ARM SDK
- [#8349](https://github.com/microsoft/typespec/pull/8349) Fix dependencies of pyproject.toml for ARM SDK
- [#8319](https://github.com/microsoft/typespec/pull/8319) Add imports for readonly and constant props for msrest model generation


## 0.16.0

### Deprecations

- [#8311](https://github.com/microsoft/typespec/pull/8311) Deprecate multiapi

### Features

- [#8209](https://github.com/microsoft/typespec/pull/8209) Add keyword only signature `cloud_setting` into ARM client
- [#7824](https://github.com/microsoft/typespec/pull/7824) Upgrade typing for dict, list, set, and tuple to be from stdlib

### Bump dependencies

- [#8233](https://github.com/microsoft/typespec/pull/8233) Upgrade azure-http-specs version.

### Bug Fixes

- [#8189](https://github.com/microsoft/typespec/pull/8189) fix to keep some existing parts of pyproject.toml
- [#8248](https://github.com/microsoft/typespec/pull/8248) Generated model which is not only used in paging response
- [#8250](https://github.com/microsoft/typespec/pull/8250) don't send content-type when no request body


## 0.15.2

### Bug Fixes

- [#8175](https://github.com/microsoft/typespec/pull/8175) fix generated output folder for `generated_samples/generated_tests`
- [#8117](https://github.com/microsoft/typespec/pull/8117) keep declaration of pyproject.toml same with existing setup.py of ARM SDK


## 0.15.1

### Bump dependencies

- [#7968](https://github.com/microsoft/typespec/pull/7968) Adopt latest TCGC.
- [#8135](https://github.com/microsoft/typespec/pull/8135) Bump tsp packages to 1.3.0 and 0.59.0

### Bug Fixes

- [#7911](https://github.com/microsoft/typespec/pull/7911) [python] don't fail on response body consumption in `_failsafe_deserialize`
- [#8124](https://github.com/microsoft/typespec/pull/8124) Don't include folder suffixes in documentation generated with `generation-subdir`
- [#8114](https://github.com/microsoft/typespec/pull/8114) Exclude doc folder in pyproject.toml


## 0.15.0

### Features

- [#7829](https://github.com/microsoft/typespec/pull/7829) Adding pyproject.toml generation and optional keep-setup-py flag
- [#7994](https://github.com/microsoft/typespec/pull/7994) add `generation-subdir` flag

### Bug Fixes

- [#8070](https://github.com/microsoft/typespec/pull/8070) fix import for error model in multi namespace
- [#8091](https://github.com/microsoft/typespec/pull/8091) Don't hardcode `emit-cross-language-definition-file` as `true` for azure generations
- [#8006](https://github.com/microsoft/typespec/pull/8006) Ensure necessary typing imports for internal models


## 0.14.2

### Bug Fixes

- [#8058](https://github.com/microsoft/typespec/pull/8058) fix outputfolder of packaging files for arm sdk


## 0.14.1

### Bump dependencies

- [#7820](https://github.com/microsoft/typespec/pull/7820) Bump min dep of generated sdks on `azure-core` to `1.35.0` for backcompat serialization methods

### Bug Fixes

- [#7992](https://github.com/microsoft/typespec/pull/7992) Import mixins from operations init file to get patch changes
- [#8039](https://github.com/microsoft/typespec/pull/8039) Don't hardcode client in sample to first client in list
- [#7939](https://github.com/microsoft/typespec/pull/7939) Pad `datetime` as a model property for typespec


## 0.14.0

### Features

- [#7924](https://github.com/microsoft/typespec/pull/7924) Support @override to reorder operation parameters

### Bump dependencies

- [#7924](https://github.com/microsoft/typespec/pull/7924) bump typespec


## 0.13.0

### Features

- [#7817](https://github.com/microsoft/typespec/pull/7817) Make mixin operations classes private to remove from documentation


## 0.12.5

### Bug Fixes

- [#7760](https://github.com/microsoft/typespec/pull/7760) [http-client-python] Add support for uv package manager alongside pip


## 0.12.4

### Bump dependencies

- [#7735](https://github.com/microsoft/typespec/pull/7735) bump TCGC 0.57.2

### Bug Fixes

- [#7713](https://github.com/microsoft/typespec/pull/7713) Allow discriminators in derived classes that are from a fixed enum class


## 0.12.3

### Bug Fixes

- [#7705](https://github.com/microsoft/typespec/pull/7705) Validate api versions by looking at ordering of api versions from spec
- [#7696](https://github.com/microsoft/typespec/pull/7696) Add support for `validate-versioning` flag, so users can toggle whether they get api versioning validation


## 0.12.2

### Bump dependencies

- [#7667](https://github.com/microsoft/typespec/pull/7667) bump typespec


## 0.12.1

### Bump dependencies

- [#7613](https://github.com/microsoft/typespec/pull/7613) bump typespec


## 0.12.0

### Features

- [#7359](https://github.com/microsoft/typespec/pull/7359) store apiVersion info in `_metadata.json`

### Bug Fixes

- [#7325](https://github.com/microsoft/typespec/pull/7325) Fix response type of paging operations from `Iterable` to `ItemPaged`
- [#7348](https://github.com/microsoft/typespec/pull/7348) Reallow models-only packages


## 0.11.3

### Bump dependencies

- [e56daba](https://github.com/microsoft/typespec/commit/e56daba78a00ce5cec79ded770a512d4dc8df66c) Bump typespec 1.0.0

### Bug Fixes

- [#7119](https://github.com/microsoft/typespec/pull/7119) Fix typing for generic `PipelineClient`
- [#7152](https://github.com/microsoft/typespec/pull/7152) Add support for legacy parameterized next links


## 0.11.2

### Other Changes

- Bump typespec and typespec-azure to latest version


## 0.11.1

### Bug Fixes

- [#6646](https://github.com/microsoft/typespec/pull/6646) Reorder generated `_vendor` file into a `_utils_` folder
- [#7062](https://github.com/microsoft/typespec/pull/7062) Remove warnings thrown if no `package-name` is specified, since this is the default behavior we want


## 0.11.0

### Features

- [#6968](https://github.com/microsoft/typespec/pull/6968) Support parameter promoting to client level and add tests.
- [#6955](https://github.com/microsoft/typespec/pull/6955) Support optional path parameter.

### Bug Fixes

- [#6979](https://github.com/microsoft/typespec/pull/6979) Improve emitter performance by updating black plugin implementation.
- [#7048](https://github.com/microsoft/typespec/pull/7048) Align key in apiview mapping with apiview structure


## 0.10.0

### Features

- [#5925](https://github.com/microsoft/typespec/pull/5925) Improve user experience in multi clouds scenario

### Bug Fixes

- [#7005](https://github.com/microsoft/typespec/pull/7005) Fix docstring type for multi namespaces
- [#7007](https://github.com/microsoft/typespec/pull/7007) Fix for setup.py
- [#6977](https://github.com/microsoft/typespec/pull/6977) add more hooks into setup.py template for users with custom templates


## 0.9.2

### Bug Fixes

- [#6974](https://github.com/microsoft/typespec/pull/6974) Allow `_` in namespaces

### Other Changes

- Drop support for python3.8

## 0.9.1

### Bug Fixes

- [6846](https://github.com/microsoft/typespec/pull/6846) fix license header for legacy SDK

## 0.9.0

### Features

- [#6549](https://github.com/microsoft/typespec/pull/6549) Pass authentication flows info into credential policy for unbranded


## 0.8.2

### Bug Fixes

- [#5649](https://github.com/microsoft/typespec/pull/5649) Always respect namespace from TCGC


## 0.8.1

### Other Changes

- Bump `@typespec/*` 0.67.0

## 0.8.0

### Features

- [#6242](https://github.com/microsoft/typespec/pull/6242) support continuation token for paging


## 0.7.1

### Bug Fixes

- [6579d19](https://github.com/microsoft/typespec/commit/6579d19b4ce852aa62c78b1e1ce871ecd884a554) pass combined types to python generator


## 0.7.0

### Features

- [#5930](https://github.com/microsoft/typespec/pull/5930) Report TCGC diagnostics after create SDK context.

### Bug Fixes

- [#6163](https://github.com/microsoft/typespec/pull/6163) Fix sphinx syntax for raising `DeserializationError` in serialization file
- [#6138](https://github.com/microsoft/typespec/pull/6138) [python] remove useless docstring for models
- [#6104](https://github.com/microsoft/typespec/pull/6104) [python] Don't throw error directly when emitter crash


## 0.6.11

No changes, version bump only.

## 0.6.10

### Bug Fixes

- [#5739](https://github.com/microsoft/typespec/pull/5739) Fix output folder of models when output folder is different with namespace in configuration
- [#5862](https://github.com/microsoft/typespec/pull/5862) Fix crash when value of `--package-pprint-name` contains space
- [#5764](https://github.com/microsoft/typespec/pull/5764) Fix bug in indentation for wrapping a property description that includes a long url
- [#5853](https://github.com/microsoft/typespec/pull/5853) Improve logging by catching expected `ModuleNotFoundError`


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
