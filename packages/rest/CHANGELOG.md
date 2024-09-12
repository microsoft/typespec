# Change Log - @typespec/rest

## 0.60.0

### Features

- [#4139](https://github.com/microsoft/typespec/pull/4139) Internals: Migrate to new api for declaring decorator implementation


## 0.59.1

### Bug Fixes

- [#4155](https://github.com/microsoft/typespec/pull/4155) HotFix: Uri template not correctly built when using `@autoRoute`


## 0.59.0

### Bump dependencies

- [#3948](https://github.com/microsoft/typespec/pull/3948) Update dependencies

### Features

- [#3932](https://github.com/microsoft/typespec/pull/3932) Add support for URI templates in routes


## 0.58.0

### Bump dependencies

- [#3718](https://github.com/microsoft/typespec/pull/3718) Dependency updates July 2024


## 0.57.0

### Bug Fixes

- [#3022](https://github.com/microsoft/typespec/pull/3022) Update types to support new values in TypeSpec

### Bump dependencies

- [#3401](https://github.com/microsoft/typespec/pull/3401) Update dependencies - May 2024


## 0.56.0

### Bump dependencies

- [#3169](https://github.com/microsoft/typespec/pull/3169) Update dependencies

### Features

- [#2945](https://github.com/microsoft/typespec/pull/2945) Add support for new `@bodyRoot` and `@body` distinction


## 0.55.0

### Bump dependencies

- [#3027](https://github.com/microsoft/typespec/pull/3027) Update dependencies


## 0.54.0

### Bump dependencies

- [#2900](https://github.com/microsoft/typespec/pull/2900) Update dependencies


## 0.53.0

### Patch Changes



## 0.52.0

Wed, 24 Jan 2024 05:46:53 GMT

### Updates

- Handle custom @path name in the building of the route
- Rename template parameters in preparation for named template argument instantiation.
- Update dependencies

## 0.51.0

Wed, 06 Dec 2023 19:40:58 GMT

### Updates

- Fix issue with `ResourceCreateModel` template collecting "update" properties instead of "create" properties.

## 0.50.0

Wed, 08 Nov 2023 00:07:17 GMT

### Updates

- `TypeScript` use `types` entry under `exports` of `package.json` instead of legacy `typesVersions` to provide the definition files
- **BREAKING CHANGE** Dropped support for node 16, minimum node version is now 18

## 0.49.0

Wed, 11 Oct 2023 23:31:35 GMT

### Updates

- Correct rest → http peer dependency. Fixes #2391
- Fix: `@key` can now appear on the base model of a resource.
- Update dependencies

## 0.48.0

Tue, 12 Sep 2023 21:47:11 GMT

_Version update only_

## 0.47.0

Tue, 08 Aug 2023 22:32:10 GMT

_Version update only_

## 0.46.0

Tue, 11 Jul 2023 22:06:00 GMT

### Updates

- Make internal `resourceTypeForKeyParam` decorator private
- Add `isListOperation` function migrated from `@typespec/compiler`
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

- Cleanup deprecated use
- Update decorator declaration to use `Model` instead of `object`
- Add validation to ensure that @action or @collectionAction operations have a specified name when used with @sharedRoute
- Update dependencies

## 0.43.0

Tue, 11 Apr 2023 18:49:17 GMT

### Updates

- Fix issue where `@action("")` was treated the same as `@action`. Now this emits an error.

## 0.42.0

Mon, 13 Mar 2023 21:30:44 GMT

_Version update only_

## 0.41.0

Fri, 03 Mar 2023 19:59:17 GMT

### Updates

- Revert back changelog
- Fix issue with filtering of visibility decorator on resource key not working when multiple copies of the compiler are loaded.
- Move core HTTP functionality from `@typespec/rest` into a new `@typespec/http` library
- **Breaking change:** The `@autoRoute` decorator can no longer be applied to namespaces
- **Breaking change:** The unimplemented `@routeReset` decorator has been removed
- Update package.json entrypoint to tspMain
- Rename to TypeSpec
- Readme.md update
- Update homepage link

## 0.40.0

Tue, 07 Feb 2023 21:56:17 GMT

### Updates

- Give KeysOf and ParentKeysOf friendly name to dedupe parameters
- Removed `@segmentSeparator`, `@produces` and `@consumes` decorators. Removed `getSegmentSeparator`, `getProduces` and `getConsumes` functions.
- Allow @route and @autoRoute to be used together.

## 0.39.0

Fri, 13 Jan 2023 00:05:26 GMT

### Patches

- Support query/header/path encoding options
- Generate recursive update schemas with optional properties for resource update operation

## 0.38.1

Wed, 14 Dec 2022 20:34:58 GMT

### Patches

- Fix: Broken doc comment causing IDE build to not show errors

## 0.38.0

Wed, 07 Dec 2022 17:21:52 GMT

### Minor changes

- Internal: update to use new `getTypeName` and `getNamespaceString` helper
- Add validation for `@route` to prevent `@route` used twice on the same operation/interface/namespace
- Add support for multiple services
- Uptake changes to compiler api to support Scalars
- Add `@actionSegment` decorator. Deprecate `@segmentSeparator`.
- Update `ResourceLocation` to `extends url` instead of deprecated `uri`
- Validate `multipart/form-data` request body is a `Model`
- **Deprecation** Updated the `HttpOperationParameters` interface to include a new `body` field replacing the `bodyType` and `bodyParameter`.

### Patches

- Add cadl docs on decorators
- Update docs.
- Update dependencies

## 0.19.0

Sat, 12 Nov 2022 00:14:04 GMT

### Minor changes

- Declare decorators in cadl using `extern dec`
- Add MetadataInfo.getEffectivePayloadType helper
- Deprecate write visibility
- Allow `@route` and `@resetRoute` to accept a `shared` property to suppress route uniqueness validation.

### Patches

- Fix: Issue with duplicate key in spread models
- Move `duplicate-parent-key` check from the `parentResource` decorator to a linting rule

## 0.18.0

Wed, 12 Oct 2022 21:12:35 GMT

### Minor changes

- Empty object as a response will not produce a 204 response anymore
- Feature: Add `isContentTypeHeader` helper.
- Implement automatic visibility transformations
- **BREAKING** Remove `@discriminator` decorator. (Moved to @cadl-lang/compiler)
- Disallow optional path params even if they have a default value
- Add support for overloads(Using `@overload` decorator)
- Reorganization of http data accessor. `getAllRoutes` is now deprecated and replaced with `getAllHttpServices`
- `ResourceLocation<T>` is `uri`

### Patches

- Remove workaround for issue https://github.com/microsoft/cadl/issues/1069
- Detect unannotated path parameters that are specified in route path

## 0.17.0

Thu, 08 Sep 2022 01:04:53 GMT

### Minor changes

- **Deprecation**: Mark `@produces` and `@consumes` as deprecated
- Uptake changes to compiler with current projection
- Update decororator state key to allow multiple instance of library to work together.
- React to Type suffix removal
- **BREAKING CHANGE** Rename `Page` to `CollectionWithNextLink`
- Fix doc for route and move autoRoute to rest library
- Api: Service Authentication oauth2 flow scopes is now an object with value and description

### Patches

- Api: Route resolution take projection into account
- Guard against uninitialized parent type in `parentResource` decorator
- Support more kinds of unions, fix various union bugs, and add support for @discriminator on unions

## 0.16.0

Thu, 11 Aug 2022 19:05:23 GMT

### Minor changes

- Add new `@useAuth` decorator providing support to define service authentication
- Uptake changes to type relations
- Update resource operation interfaces to configure Create and Update model properties correctly
- Support set of unannotated parameters as request body
- Add friendly name for Page<T> as TPage
- Make OkResponse non-generic
- Remove `groupName` from `OperationDetails`
- Emit diagnostic when defining @path property that is optional without a default value
- Update route resolution logic to be more consistent. If service namespace is provided use routes under otherwise use routes directly at the global namespace level(do not go into the nested namespaces)
- Internal: Uptake new compiler helpers to work with template types

### Patches

- Add a @resource decorator to simplify how one defines resource types and specifies the collection (segment) name
- Add `ResourceCreateOrReplace` type and `createsOrReplaces` decorator to model an "upsert" operation
- Improve `cloneKeyProperties` implementation so that original model type is not affected
- Ensure that all @key properties turned into @path parameters by KeysOf<T> are required even if the original is optional
- Operations with a body and no verb will default route to POST
- Add `ResourceLocation<T>` to mark a property as containing a link to a specific resource type
- Make response descriptions more consistent

### Updates

- readme.md documentation change

## 0.15.1

Fri, 08 Jul 2022 23:22:57 GMT

### Patches

- $consumes decorator better validation
- Add `@collectionAction` decorator for defining collection-level resource actions
- Make string literal "Content-Type" header check case-insensitive

## 0.15.0

Mon, 13 Jun 2022 23:42:28 GMT

### Minor changes

- Uptake changes to compiler with decorator validator helpers
- Update accessor functions `getAllRoutes`, `getContentTypes`, etc. to follow the new Accessor pattern which return any encountered diagnostics along with the expected value
- Uptake changes to decorator context
- Added `@server` decorator to specify namespace endpoints
- Fix decorator and functions not belonging to a namespace

### Patches

- Properly exclude operation templates when scanning for routes
- Skip templated operations when scanning for operation routes
- Enable customization of route segment separators in autoRoutes

### Updates

- Upgrade to TS4.7

## 0.14.0

Fri, 06 May 2022 17:19:57 GMT

### Minor changes

- Add RouteOptions and AutoRouteOptions types to enable customization of automatic route generation when calling getAllRoutes
- Uptake `mixes` -> `extends` rename
- Remove node 14 support

### Patches

- Fix issue where empty response model with children would result in 204"
- Add validation to `Resource` interface to ensure `TError` is an error type

## 0.13.0

Thu, 31 Mar 2022 17:10:49 GMT

### Minor changes

- Handle error type being passed to `KeyOf` model
- Add validation when using Resource interfaces when missing @key on resource
- Add logic to interpret the http responses.

### Patches

- Fix issue with empty routes in namespace/interface and operation causing path with '//'
- Support browser builds
- Raise a diagnostic when a resource type specifies a parent type which holds the same key name.

## 0.12.0

Wed, 09 Mar 2022 17:42:09 GMT

### Minor changes

- Move @key decorator to core

### Patches

- Filter out string literal typed path parameters when generating routes automatically

## 0.11.0

Tue, 15 Feb 2022 22:35:02 GMT

### Minor changes

- Add validation to decorators

## 0.10.0

Mon, 14 Feb 2022 03:01:07 GMT

### Minor changes

- refactor status code handling to http library
- Update decorators to take in api change

### Patches

- Bump dependency versions

## 0.9.0

Fri, 04 Feb 2022 18:00:18 GMT

### Minor changes

- Add support for discriminator decorator
- Internals: switch to internal path manipulation
- Added shared logic to resolve http operation parameters and validate compatibility(duplicate bodies)
- **Added** Validation for uniqueness of operation by verb and path
- **Added** `@head` decorator to describe `head` http verb operation
- Validate http verb decorators(`@get`, `@post`, etc.) do not receive any argument
- Expose response template in Http library and refactor
- Add statusCode decorator for http status code
- \*\*Validate `@route` decorator is used only once
- Update cadl dependencies to peerDependencies

### Patches

- Move `@key`, `@parentResource`, and `@copyResourceKeyParameters` decorators into `Cadl.Rest`
- Operations marked with `@action` will now default to `POST` verb unless another verb has been explicitly specified
- Add interfaces for modelling extension and singleton resources
- **Fix** Duplicate @key on model properties will produce diagnostic instead of exception

## 0.8.0

Thu, 16 Dec 2021 08:02:20 GMT

### Minor changes

- Add Cadl.Http.PlainData<T>

### Patches

- Adding @CreateOrUpdate (PUT) and standard operation in REST.
- camelCase operations
- Add new route scanning functionality which provides the same capabilities (both explicit and autogenerated routes) to normal operations and those defined inside of interfaces

### Updates

- Formatting changes

## 0.7.1

Wed, 01 Dec 2021 22:56:11 GMT

### Patches

- Add README

## 0.7.0

Thu, 18 Nov 2021 13:58:15 GMT

### Minor changes

- Refactor REST and HTTP decorators and split them into Cadl.Rest and Cadl.Http, respectively

### Patches

- Add new Cadl.Rest.Resource namespace for new resource modelling pattern
- Add documentation strings to models and operations

## 0.6.4

Thu, 11 Nov 2021 21:46:21 GMT

_Version update only_

## 0.6.3

Thu, 28 Oct 2021 21:17:50 GMT

### Patches

- Remove management.azure.com service host default

## 0.6.2

Fri, 15 Oct 2021 21:33:37 GMT

### Patches

- Strongly defined diagnostics

## 0.6.1

Fri, 17 Sep 2021 00:49:37 GMT

_Version update only_

## 0.6.0

Sat, 21 Aug 2021 00:04:02 GMT

### Minor changes

- Introduce naming convention `$name` for JavaScript-defined Cadl functions and decorators

## 0.5.1

Fri, 13 Aug 2021 19:10:21 GMT

### Patches

- Add isHeader functionality to discover if a property is a header property

## 0.5.0

Tue, 10 Aug 2021 20:23:04 GMT

### Minor changes

- Rename package to @cadl-lang/rest

## 0.4.1

Mon, 09 Aug 2021 21:14:12 GMT

_Version update only_

## 0.4.0

Mon, 02 Aug 2021 18:17:00 GMT

### Minor changes

- Rename ADL to Cadl

## 0.3.2

Wed, 28 Jul 2021 19:40:06 GMT

### Patches

- Add additional api to support code generation and host property

## 0.3.1

Fri, 09 Jul 2021 20:21:06 GMT

_Version update only_

## 0.3.0

Thu, 24 Jun 2021 03:57:43 GMT

### Minor changes

- Add semantic error recovery

## 0.2.1

Tue, 18 May 2021 23:43:31 GMT

_Version update only_

## 0.2.0

Thu, 06 May 2021 14:56:01 GMT

### Minor changes

- Implement alias and enum, remove model =

### Patches

- **Added** New type NoContentResponse
- Replace several internal compiler errors with diagnostics

## 0.1.2

Tue, 20 Apr 2021 15:23:29 GMT

_Initial release_
