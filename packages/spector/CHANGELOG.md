# Change Log - @typespec/spector

## 0.1.0-alpha.25

### Features

- [#10011](https://github.com/microsoft/typespec/pull/10011) Add matcher framework for flexible value comparison in scenarios. `match.dateTime()` enables semantic datetime comparison that handles precision and timezone differences across languages.

### Bug Fixes

- [#10259](https://github.com/microsoft/typespec/pull/10259) Fix query parameter matcher handling: use `resolveMatchers: false` so matcher objects (e.g. `match.dateTime`) are checked semantically instead of being serialized to plain strings before comparison.


## 0.1.0-alpha.24

### Bump dependencies

- [#9838](https://github.com/microsoft/typespec/pull/9838) Upgrade dependencies

### Bug Fixes

- [#9752](https://github.com/microsoft/typespec/pull/9752) Update to how coverage manifest are managed. The manifest upload each individual one as a single file


## 0.1.0-alpha.23

### Bump dependencies

- [#9446](https://github.com/microsoft/typespec/pull/9446) Upgrade dependencies


## 0.1.0-alpha.22

### Bump dependencies

- [#9223](https://github.com/microsoft/typespec/pull/9223) Upgrade dependencies


## 0.1.0-alpha.21

### Bump dependencies

- [#9046](https://github.com/microsoft/typespec/pull/9046) Upgrade dependencies

### Bug Fixes

- [#8985](https://github.com/microsoft/typespec/pull/8985) Add new `sourceUrl` handling for the go to source navigation
- [#9016](https://github.com/microsoft/typespec/pull/9016) Switch `js-yaml` to `yaml` library


## 0.1.0-alpha.20

### Features

- [#8938](https://github.com/microsoft/typespec/pull/8938) Resolve packageName and spec display name from spec set package.json

### Bump dependencies

- [#8823](https://github.com/microsoft/typespec/pull/8823) Upgrade dependencies


## 0.1.0-alpha.19

### Bump dependencies

- [#8437](https://github.com/microsoft/typespec/pull/8437) Upgrade dependencies


## 0.1.0-alpha.18

### Bump dependencies

- [#8317](https://github.com/microsoft/typespec/pull/8317) Upgrade dependencies


## 0.1.0-alpha.17

### Bump dependencies

- [#7978](https://github.com/microsoft/typespec/pull/7978) Upgrade dependencies


## 0.1.0-alpha.16

### Bump dependencies

- [#7674](https://github.com/microsoft/typespec/pull/7674) Upgrade dependencies


## 0.1.0-alpha.15

### Bump dependencies

- [#7477](https://github.com/microsoft/typespec/pull/7477) Update multer dependency
- [#7323](https://github.com/microsoft/typespec/pull/7323) Upgrade dependencies


## 0.1.0-alpha.14

### Bug Fixes

- [#7270](https://github.com/microsoft/typespec/pull/7270) Fix specs using `dyn` when using port `0`


## 0.1.0-alpha.13

### Features

- [#7066](https://github.com/microsoft/typespec/pull/7066) Add dynamic value resolution in spector mock apis with a new `dyn` string template builder


## 0.1.0-alpha.12

### Features

- [#6926](https://github.com/microsoft/typespec/pull/6926) Upgrade to express v5


## 0.1.0-alpha.10

No changes, version bump only.

## 0.1.0-alpha.10

### Features

- [#6565](https://github.com/microsoft/typespec/pull/6565) Make handling of request body and response body consistent
- [#6543](https://github.com/microsoft/typespec/pull/6543) Rename `server-test` command to `knock`

### Bump dependencies

- [#6595](https://github.com/microsoft/typespec/pull/6595) Upgrade dependencies

### Bug Fixes

- [#6527](https://github.com/microsoft/typespec/pull/6527) Don't throw for scenarios that expect error response
- [#6562](https://github.com/microsoft/typespec/pull/6562) Updates `tsp-spector knock` to exit with a failure if no scenarios are executed
- [#6543](https://github.com/microsoft/typespec/pull/6543) Add new `--filter` option to `knock` command


## 0.1.0-alpha.9

### Features

- [#6327](https://github.com/microsoft/typespec/pull/6327) Remove reference to delete projection feature
- [#6201](https://github.com/microsoft/typespec/pull/6201) Support `application/jsonl` as binary.

### Bump dependencies

- [#6266](https://github.com/microsoft/typespec/pull/6266) Update dependencies


## 0.1.0-alpha.8

No changes, version bump only.

## 0.1.0-alpha.7

### Bump dependencies

- [#5690](https://github.com/microsoft/typespec/pull/5690) Upgrade dependencies


## 0.1.0-alpha.6

No changes, version bump only.

## 0.1.0-alpha.5

No changes, version bump only.

## 0.1.0-alpha.4

- Update `server start` script parameter - `scenarioPath` to `scenarioPaths`.

## 0.1.0-alpha.3

No changes, version bump only.

## 0.1.0-alpha.2

- Fix the handling of multiple scenario paths in `manifest.json` file.

## 0.1.0-alpha.1

- Enabled handling of multiple scenario paths

## 0.1.0-alpha.0

- Initial release of the `@typespec/spector` package.
