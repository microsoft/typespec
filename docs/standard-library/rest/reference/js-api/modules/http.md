[Documentation](../index.md) / http

# Namespace: http

## Table of contents

### Enumerations

- [Visibility](../enums/http.Visibility.md)

### Interfaces

- [ApiKeyAuth](../interfaces/http.ApiKeyAuth.md)
- [AuthenticationOption](../interfaces/http.AuthenticationOption.md)
- [AuthorizationCodeFlow](../interfaces/http.AuthorizationCodeFlow.md)
- [AutoRouteOptions](../interfaces/http.AutoRouteOptions.md)
- [BasicAuth](../interfaces/http.BasicAuth.md)
- [BearerAuth](../interfaces/http.BearerAuth.md)
- [ClientCredentialsFlow](../interfaces/http.ClientCredentialsFlow.md)
- [FilteredRouteParam](../interfaces/http.FilteredRouteParam.md)
- [HttpAuthBase](../interfaces/http.HttpAuthBase.md)
- [HttpOperation](../interfaces/http.HttpOperation.md)
- [HttpOperationBody](../interfaces/http.HttpOperationBody.md)
- [HttpOperationParameter](../interfaces/http.HttpOperationParameter.md)
- [HttpOperationParameters](../interfaces/http.HttpOperationParameters.md)
- [HttpOperationRequestBody](../interfaces/http.HttpOperationRequestBody.md)
- [HttpOperationResponse](../interfaces/http.HttpOperationResponse.md)
- [HttpOperationResponseContent](../interfaces/http.HttpOperationResponseContent.md)
- [HttpServer](../interfaces/http.HttpServer.md)
- [HttpService](../interfaces/http.HttpService.md)
- [ImplicitFlow](../interfaces/http.ImplicitFlow.md)
- [MetadataInfo](../interfaces/http.MetadataInfo.md)
- [MetadataInfoOptions](../interfaces/http.MetadataInfoOptions.md)
- [OAuth2Scope](../interfaces/http.OAuth2Scope.md)
- [Oauth2Auth](../interfaces/http.Oauth2Auth.md)
- [PasswordFlow](../interfaces/http.PasswordFlow.md)
- [RouteOptions](../interfaces/http.RouteOptions.md)
- [RoutePath](../interfaces/http.RoutePath.md)
- [RouteResolutionOptions](../interfaces/http.RouteResolutionOptions.md)
- [ServiceAuthentication](../interfaces/http.ServiceAuthentication.md)

### Type Aliases

- [HttpAuth](http.md#httpauth)
- [HttpVerb](http.md#httpverb)
- [OAuth2Flow](http.md#oauth2flow)
- [OAuth2FlowType](http.md#oauth2flowtype)
- [OperationContainer](http.md#operationcontainer)
- [OperationDetails](http.md#operationdetails)
- [StatusCode](http.md#statuscode)

### Variables

- [namespace](http.md#namespace)

### Functions

- [$body](http.md#$body)
- [$delete](http.md#$delete)
- [$get](http.md#$get)
- [$head](http.md#$head)
- [$header](http.md#$header)
- [$includeInapplicableMetadataInPayload](http.md#$includeinapplicablemetadatainpayload)
- [$patch](http.md#$patch)
- [$path](http.md#$path)
- [$plainData](http.md#$plaindata)
- [$post](http.md#$post)
- [$put](http.md#$put)
- [$query](http.md#$query)
- [$route](http.md#$route)
- [$routeReset](http.md#$routereset)
- [$server](http.md#$server)
- [$statusCode](http.md#$statuscode)
- [$useAuth](http.md#$useauth)
- [createMetadataInfo](http.md#createmetadatainfo)
- [gatherMetadata](http.md#gathermetadata)
- [getAllHttpServices](http.md#getallhttpservices)
- [getAllRoutes](http.md#getallroutes)
- [getAuthentication](http.md#getauthentication)
- [getContentTypes](http.md#getcontenttypes)
- [getHeaderFieldName](http.md#getheaderfieldname)
- [getHttpOperation](http.md#gethttpoperation)
- [getHttpService](http.md#gethttpservice)
- [getOperationParameters](http.md#getoperationparameters)
- [getOperationVerb](http.md#getoperationverb)
- [getPathParamName](http.md#getpathparamname)
- [getQueryParamName](http.md#getqueryparamname)
- [getRequestVisibility](http.md#getrequestvisibility)
- [getResponsesForOperation](http.md#getresponsesforoperation)
- [getRouteOptionsForNamespace](http.md#getrouteoptionsfornamespace)
- [getRoutePath](http.md#getroutepath)
- [getServers](http.md#getservers)
- [getStatusCodeDescription](http.md#getstatuscodedescription)
- [getStatusCodes](http.md#getstatuscodes)
- [getVisibilitySuffix](http.md#getvisibilitysuffix)
- [includeInapplicableMetadataInPayload](http.md#includeinapplicablemetadatainpayload)
- [isApplicableMetadata](http.md#isapplicablemetadata)
- [isApplicableMetadataOrBody](http.md#isapplicablemetadataorbody)
- [isBody](http.md#isbody)
- [isContentTypeHeader](http.md#iscontenttypeheader)
- [isHeader](http.md#isheader)
- [isMetadata](http.md#ismetadata)
- [isOverloadSameEndpoint](http.md#isoverloadsameendpoint)
- [isPathParam](http.md#ispathparam)
- [isQueryParam](http.md#isqueryparam)
- [isStatusCode](http.md#isstatuscode)
- [isVisible](http.md#isvisible)
- [listHttpOperationsIn](http.md#listhttpoperationsin)
- [reportIfNoRoutes](http.md#reportifnoroutes)
- [setAuthentication](http.md#setauthentication)
- [setRouteOptionsForNamespace](http.md#setrouteoptionsfornamespace)
- [setStatusCode](http.md#setstatuscode)
- [validateRouteUnique](http.md#validaterouteunique)

## Type Aliases

### HttpAuth

Ƭ **HttpAuth**: [`BasicAuth`](../interfaces/http.BasicAuth.md) \| [`BearerAuth`](../interfaces/http.BearerAuth.md) \| [`ApiKeyAuth`](../interfaces/http.ApiKeyAuth.md)<`ApiKeyLocation`, `string`\> \| [`Oauth2Auth`](../interfaces/http.Oauth2Auth.md)<[`OAuth2Flow`](http.md#oauth2flow)[]\>

___

### HttpVerb

Ƭ **HttpVerb**: ``"get"`` \| ``"put"`` \| ``"post"`` \| ``"patch"`` \| ``"delete"`` \| ``"head"``

___

### OAuth2Flow

Ƭ **OAuth2Flow**: [`AuthorizationCodeFlow`](../interfaces/http.AuthorizationCodeFlow.md) \| [`ImplicitFlow`](../interfaces/http.ImplicitFlow.md) \| [`PasswordFlow`](../interfaces/http.PasswordFlow.md) \| [`ClientCredentialsFlow`](../interfaces/http.ClientCredentialsFlow.md)

___

### OAuth2FlowType

Ƭ **OAuth2FlowType**: [`OAuth2Flow`](http.md#oauth2flow)[``"type"``]

___

### OperationContainer

Ƭ **OperationContainer**: `Namespace` \| `Interface`

___

### OperationDetails

Ƭ **OperationDetails**: [`HttpOperation`](../interfaces/http.HttpOperation.md)

**`Deprecated`**

use `HttpOperation`. To remove in November 2022 release.

___

### StatusCode

Ƭ **StatusCode**: \`${number}\` \| ``"*"``

## Variables

### namespace

• `Const` **namespace**: ``"Cadl.Http"``

## Functions

### $body

▸ **$body**(`context`, `entity`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `ModelProperty` |

#### Returns

`void`

___

### $delete

▸ **$delete**(`context`, `entity`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Operation` |

#### Returns

`void`

___

### $get

▸ **$get**(`context`, `entity`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Operation` |

#### Returns

`void`

___

### $head

▸ **$head**(`context`, `entity`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Operation` |

#### Returns

`void`

___

### $header

▸ **$header**(`context`, `entity`, `headerName?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `ModelProperty` |
| `headerName?` | `string` |

#### Returns

`void`

___

### $includeInapplicableMetadataInPayload

▸ **$includeInapplicableMetadataInPayload**(`context`, `entity`, `value`): `void`

Specifies if inapplicable metadata should be included in the payload for
the given entity. This is true by default unless changed by this
decorator.

**`See`**

isApplicableMetadata

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `context` | `DecoratorContext` | - |
| `entity` | `Type` | Target model, namespace, or model property. If applied to a model or namespace, applies recursively to child models, namespaces, and model properties unless overridden by applying this decorator to a child. |
| `value` | `boolean` | `true` to include inapplicable metadata in payload, false to exclude it. |

#### Returns

`void`

___

### $patch

▸ **$patch**(`context`, `entity`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Operation` |

#### Returns

`void`

___

### $path

▸ **$path**(`context`, `entity`, `paramName?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `ModelProperty` |
| `paramName?` | `string` |

#### Returns

`void`

___

### $plainData

▸ **$plainData**(`context`, `entity`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Type` |

#### Returns

`void`

___

### $post

▸ **$post**(`context`, `entity`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Operation` |

#### Returns

`void`

___

### $put

▸ **$put**(`context`, `entity`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Operation` |

#### Returns

`void`

___

### $query

▸ **$query**(`context`, `entity`, `queryKey?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `ModelProperty` |
| `queryKey?` | `string` |

#### Returns

`void`

___

### $route

▸ **$route**(`context`, `entity`, `path`, `parameters?`): `void`

`@route` defines the relative route URI for the target operation

The first argument should be a URI fragment that may contain one or more path parameter fields.
If the namespace or interface that contains the operation is also marked with a `@route` decorator,
it will be used as a prefix to the route URI of the operation.

`@route` can only be applied to operations, namespaces, and interfaces.

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Type` |
| `path` | `string` |
| `parameters?` | `Model` |

#### Returns

`void`

___

### $routeReset

▸ **$routeReset**(`context`, `entity`, `path`, `parameters?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Type` |
| `path` | `string` |
| `parameters?` | `Model` |

#### Returns

`void`

___

### $server

▸ **$server**(`context`, `target`, `url`, `description`, `parameters?`): `void`

Configure the server url for the service.

**`Optional`**

Parameters to interpolate in the server url.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `context` | `DecoratorContext` | Decorator context |
| `target` | `Namespace` | Decorator target(Must be a namespace) |
| `url` | `string` | - |
| `description` | `string` | Description for this server. |
| `parameters?` | `Model` |  |

#### Returns

`void`

___

### $statusCode

▸ **$statusCode**(`context`, `entity`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `ModelProperty` |

#### Returns

`void`

___

### $useAuth

▸ **$useAuth**(`context`, `serviceNamespace`, `authConfig`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `serviceNamespace` | `Namespace` |
| `authConfig` | `Model` \| `Tuple` \| `Union` |

#### Returns

`void`

___

### createMetadataInfo

▸ **createMetadataInfo**(`program`, `options?`): [`MetadataInfo`](../interfaces/http.MetadataInfo.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `options?` | [`MetadataInfoOptions`](../interfaces/http.MetadataInfoOptions.md) |

#### Returns

[`MetadataInfo`](../interfaces/http.MetadataInfo.md)

___

### gatherMetadata

▸ **gatherMetadata**(`program`, `diagnostics`, `type`, `visibility`, `isMetadataCallback?`): `Set`<`ModelProperty`\>

Walks the given type and collects all applicable metadata and `@body`
properties recursively.

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `program` | `Program` | `undefined` |
| `diagnostics` | `DiagnosticCollector` | `undefined` |
| `type` | `Type` | `undefined` |
| `visibility` | [`Visibility`](../enums/http.Visibility.md) | `undefined` |
| `isMetadataCallback` | (`program`: `Program`, `property`: `ModelProperty`) => `boolean` | `isMetadata` |

#### Returns

`Set`<`ModelProperty`\>

___

### getAllHttpServices

▸ **getAllHttpServices**(`program`, `options?`): [[`HttpService`](../interfaces/http.HttpService.md)[], readonly `Diagnostic`[]]

Returns all the services defined.

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `options?` | [`RouteResolutionOptions`](../interfaces/http.RouteResolutionOptions.md) |

#### Returns

[[`HttpService`](../interfaces/http.HttpService.md)[], readonly `Diagnostic`[]]

___

### getAllRoutes

▸ **getAllRoutes**(`program`, `options?`): [[`HttpOperation`](../interfaces/http.HttpOperation.md)[], readonly `Diagnostic`[]]

**`Deprecated`**

use `getAllHttpServices` or `resolveHttpOperations` manually

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `options?` | [`RouteResolutionOptions`](../interfaces/http.RouteResolutionOptions.md) |

#### Returns

[[`HttpOperation`](../interfaces/http.HttpOperation.md)[], readonly `Diagnostic`[]]

___

### getAuthentication

▸ **getAuthentication**(`program`, `namespace`): [`ServiceAuthentication`](../interfaces/http.ServiceAuthentication.md) \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `namespace` | `Namespace` |

#### Returns

[`ServiceAuthentication`](../interfaces/http.ServiceAuthentication.md) \| `undefined`

___

### getContentTypes

▸ **getContentTypes**(`property`): [`string`[], readonly `Diagnostic`[]]

Resolve the content types from a model property by looking at the value.

**`Property`**

Model property

#### Parameters

| Name | Type |
| :------ | :------ |
| `property` | `ModelProperty` |

#### Returns

[`string`[], readonly `Diagnostic`[]]

List of contnet types and any diagnostics if there was an issue.

___

### getHeaderFieldName

▸ **getHeaderFieldName**(`program`, `entity`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Type` |

#### Returns

`string`

___

### getHttpOperation

▸ **getHttpOperation**(`program`, `operation`, `options?`): [[`HttpOperation`](../interfaces/http.HttpOperation.md), readonly `Diagnostic`[]]

Return the Http Operation details for a given Cadl operation.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | `Program` | - |
| `operation` | `Operation` | Operation |
| `options?` | [`RouteResolutionOptions`](../interfaces/http.RouteResolutionOptions.md) | Optional option on how to resolve the http details. |

#### Returns

[[`HttpOperation`](../interfaces/http.HttpOperation.md), readonly `Diagnostic`[]]

___

### getHttpService

▸ **getHttpService**(`program`, `serviceNamespace`, `options?`): [[`HttpService`](../interfaces/http.HttpService.md), readonly `Diagnostic`[]]

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `serviceNamespace` | `Namespace` |
| `options?` | [`RouteResolutionOptions`](../interfaces/http.RouteResolutionOptions.md) |

#### Returns

[[`HttpService`](../interfaces/http.HttpService.md), readonly `Diagnostic`[]]

___

### getOperationParameters

▸ **getOperationParameters**(`program`, `operation`, `overloadBase?`, `knownPathParamNames?`): [[`HttpOperationParameters`](../interfaces/http.HttpOperationParameters.md), readonly `Diagnostic`[]]

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `program` | `Program` | `undefined` |
| `operation` | `Operation` | `undefined` |
| `overloadBase?` | [`HttpOperation`](../interfaces/http.HttpOperation.md) | `undefined` |
| `knownPathParamNames` | `string`[] | `[]` |

#### Returns

[[`HttpOperationParameters`](../interfaces/http.HttpOperationParameters.md), readonly `Diagnostic`[]]

___

### getOperationVerb

▸ **getOperationVerb**(`program`, `entity`): [`HttpVerb`](http.md#httpverb) \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Type` |

#### Returns

[`HttpVerb`](http.md#httpverb) \| `undefined`

___

### getPathParamName

▸ **getPathParamName**(`program`, `entity`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Type` |

#### Returns

`string`

___

### getQueryParamName

▸ **getQueryParamName**(`program`, `entity`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Type` |

#### Returns

`string`

___

### getRequestVisibility

▸ **getRequestVisibility**(`verb`): [`Visibility`](../enums/http.Visibility.md)

Determines the visibility to use for a request with the given verb.

- GET | HEAD => Visibility.Query
- POST => Visibility.Update
- PUT => Visibility.Create | Update
- DELETE => Visibility.Delete

#### Parameters

| Name | Type |
| :------ | :------ |
| `verb` | [`HttpVerb`](http.md#httpverb) |

#### Returns

[`Visibility`](../enums/http.Visibility.md)

___

### getResponsesForOperation

▸ **getResponsesForOperation**(`program`, `operation`): [[`HttpOperationResponse`](../interfaces/http.HttpOperationResponse.md)[], readonly `Diagnostic`[]]

Get the responses for a given operation.

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `operation` | `Operation` |

#### Returns

[[`HttpOperationResponse`](../interfaces/http.HttpOperationResponse.md)[], readonly `Diagnostic`[]]

___

### getRouteOptionsForNamespace

▸ **getRouteOptionsForNamespace**(`program`, `namespace`): [`RouteOptions`](../interfaces/http.RouteOptions.md) \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `namespace` | `Namespace` |

#### Returns

[`RouteOptions`](../interfaces/http.RouteOptions.md) \| `undefined`

___

### getRoutePath

▸ **getRoutePath**(`program`, `entity`): [`RoutePath`](../interfaces/http.RoutePath.md) \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Interface` \| `Namespace` \| `Operation` |

#### Returns

[`RoutePath`](../interfaces/http.RoutePath.md) \| `undefined`

___

### getServers

▸ **getServers**(`program`, `type`): [`HttpServer`](../interfaces/http.HttpServer.md)[] \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `type` | `Namespace` |

#### Returns

[`HttpServer`](../interfaces/http.HttpServer.md)[] \| `undefined`

___

### getStatusCodeDescription

▸ **getStatusCodeDescription**(`statusCode`): `undefined` \| ``"The request has succeeded."`` \| ``"The request has succeeded and a new resource has been created as a result."`` \| ``"The request has been accepted for processing, but processing has not yet completed."`` \| ``"There is no content to send for this request, but the headers may be useful. "`` \| ``"The URL of the requested resource has been changed permanently. The new URL is given in the response."`` \| ``"The client has made a conditional request and the resource has not been modified."`` \| ``"The server could not understand the request due to invalid syntax."`` \| ``"Access is unauthorized."`` \| ``"Access is forbidden"`` \| ``"The server cannot find the requested resource."`` \| ``"The request conflicts with the current state of the server."`` \| ``"Precondition failed."`` \| ``"Service unavailable."`` \| ``"Informational"`` \| ``"Successful"`` \| ``"Redirection"`` \| ``"Client Error"`` \| ``"Server Error"``

#### Parameters

| Name | Type |
| :------ | :------ |
| `statusCode` | `string` |

#### Returns

`undefined` \| ``"The request has succeeded."`` \| ``"The request has succeeded and a new resource has been created as a result."`` \| ``"The request has been accepted for processing, but processing has not yet completed."`` \| ``"There is no content to send for this request, but the headers may be useful. "`` \| ``"The URL of the requested resource has been changed permanently. The new URL is given in the response."`` \| ``"The client has made a conditional request and the resource has not been modified."`` \| ``"The server could not understand the request due to invalid syntax."`` \| ``"Access is unauthorized."`` \| ``"Access is forbidden"`` \| ``"The server cannot find the requested resource."`` \| ``"The request conflicts with the current state of the server."`` \| ``"Precondition failed."`` \| ``"Service unavailable."`` \| ``"Informational"`` \| ``"Successful"`` \| ``"Redirection"`` \| ``"Client Error"`` \| ``"Server Error"``

___

### getStatusCodes

▸ **getStatusCodes**(`program`, `entity`): `string`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Type` |

#### Returns

`string`[]

___

### getVisibilitySuffix

▸ **getVisibilitySuffix**(`visibility`): `string`

Provides a naming suffix to create a unique name for a type with this
visibility.

`Visibility.All` gets empty suffix, otherwise visibilities are joined in
pascal-case with `Or`. And `Item` is if `Visibility.Item` is produced.

Examples:
 - Visibility.All => ""
 - Visibility.Read => "Read"
 - Visibility.Create | Visibility.Update => "CreateOrUpdate"
 - Visibility.Create | Visibility.Item => "CreateItem"
 - Visibility.Create | Visibility.Update | Visibility.Item =>  "CreateOrUpdateItem"

#### Parameters

| Name | Type |
| :------ | :------ |
| `visibility` | [`Visibility`](../enums/http.Visibility.md) |

#### Returns

`string`

___

### includeInapplicableMetadataInPayload

▸ **includeInapplicableMetadataInPayload**(`program`, `property`): `boolean`

Determines if the given model property should be included in the payload if it is
inapplicable metadata.

**`See`**

 - isApplicableMetadata
 - $includeInapplicableMetadataInPayload

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `property` | `ModelProperty` |

#### Returns

`boolean`

___

### isApplicableMetadata

▸ **isApplicableMetadata**(`program`, `property`, `visibility`, `isMetadataCallback?`): `boolean`

Determines if the given property is metadata that is applicable with the
given visibility.

- No metadata is applicable with Visibility.Item present.
- If only Visibility.Read is present, then only `@header` and `@status`
  properties are applicable.
- If Visibility.Read is not present, all metadata properties other than
  `@statusCode` are applicable.

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `program` | `Program` | `undefined` |
| `property` | `ModelProperty` | `undefined` |
| `visibility` | [`Visibility`](../enums/http.Visibility.md) | `undefined` |
| `isMetadataCallback` | (`program`: `Program`, `property`: `ModelProperty`) => `boolean` | `isMetadata` |

#### Returns

`boolean`

___

### isApplicableMetadataOrBody

▸ **isApplicableMetadataOrBody**(`program`, `property`, `visibility`, `isMetadataCallback?`): `boolean`

Determines if the given property is metadata or marked `@body` and
applicable with the given visibility.

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `program` | `Program` | `undefined` |
| `property` | `ModelProperty` | `undefined` |
| `visibility` | [`Visibility`](../enums/http.Visibility.md) | `undefined` |
| `isMetadataCallback` | (`program`: `Program`, `property`: `ModelProperty`) => `boolean` | `isMetadata` |

#### Returns

`boolean`

___

### isBody

▸ **isBody**(`program`, `entity`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Type` |

#### Returns

`boolean`

___

### isContentTypeHeader

▸ **isContentTypeHeader**(`program`, `property`): `boolean`

Check if the given model property is the content type header.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | `Program` | Program |
| `property` | `ModelProperty` | Model property. |

#### Returns

`boolean`

True if the model property is marked as a header and has the name `content-type`(case insensitive.)

___

### isHeader

▸ **isHeader**(`program`, `entity`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Type` |

#### Returns

`boolean`

___

### isMetadata

▸ **isMetadata**(`program`, `property`): `boolean`

Determines if a property is metadata. A property is defined to be
metadata if it is marked `@header`, `@query`, `@path`, or `@statusCode`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `property` | `ModelProperty` |

#### Returns

`boolean`

___

### isOverloadSameEndpoint

▸ **isOverloadSameEndpoint**(`overload`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `overload` | [`HttpOperation`](../interfaces/http.HttpOperation.md) & { `overloading`: [`HttpOperation`](../interfaces/http.HttpOperation.md)  } |

#### Returns

`boolean`

___

### isPathParam

▸ **isPathParam**(`program`, `entity`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Type` |

#### Returns

`boolean`

___

### isQueryParam

▸ **isQueryParam**(`program`, `entity`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Type` |

#### Returns

`boolean`

___

### isStatusCode

▸ **isStatusCode**(`program`, `entity`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Type` |

#### Returns

`boolean`

___

### isVisible

▸ **isVisible**(`program`, `property`, `visibility`): `boolean`

Determines if the given property is visible with the given visibility.

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `property` | `ModelProperty` |
| `visibility` | [`Visibility`](../enums/http.Visibility.md) |

#### Returns

`boolean`

___

### listHttpOperationsIn

▸ **listHttpOperationsIn**(`program`, `container`, `options?`): [[`HttpOperation`](../interfaces/http.HttpOperation.md)[], readonly `Diagnostic`[]]

Get all the Http Operation in the given container.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | `Program` | Program |
| `container` | [`OperationContainer`](http.md#operationcontainer) | Namespace or interface containing operations |
| `options?` | [`RouteResolutionOptions`](../interfaces/http.RouteResolutionOptions.md) | Resolution options |

#### Returns

[[`HttpOperation`](../interfaces/http.HttpOperation.md)[], readonly `Diagnostic`[]]

___

### reportIfNoRoutes

▸ **reportIfNoRoutes**(`program`, `routes`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `routes` | [`HttpOperation`](../interfaces/http.HttpOperation.md)[] |

#### Returns

`void`

___

### setAuthentication

▸ **setAuthentication**(`program`, `serviceNamespace`, `auth`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `serviceNamespace` | `Namespace` |
| `auth` | [`ServiceAuthentication`](../interfaces/http.ServiceAuthentication.md) |

#### Returns

`void`

___

### setRouteOptionsForNamespace

▸ **setRouteOptionsForNamespace**(`program`, `namespace`, `options`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `namespace` | `Namespace` |
| `options` | [`RouteOptions`](../interfaces/http.RouteOptions.md) |

#### Returns

`void`

___

### setStatusCode

▸ **setStatusCode**(`program`, `entity`, `codes`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Model` \| `ModelProperty` |
| `codes` | `string`[] |

#### Returns

`void`

___

### validateRouteUnique

▸ **validateRouteUnique**(`program`, `diagnostics`, `operations`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `diagnostics` | `DiagnosticCollector` |
| `operations` | [`HttpOperation`](../interfaces/http.HttpOperation.md)[] |

#### Returns

`void`
