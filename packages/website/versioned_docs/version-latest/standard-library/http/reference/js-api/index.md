JS Api

# JS Api

## Table of contents

### Enumerations

- [Visibility](enums/Visibility.md)

### Interfaces

- [ApiKeyAuth](interfaces/ApiKeyAuth.md)
- [AuthenticationOption](interfaces/AuthenticationOption.md)
- [AuthorizationCodeFlow](interfaces/AuthorizationCodeFlow.md)
- [BasicAuth](interfaces/BasicAuth.md)
- [BearerAuth](interfaces/BearerAuth.md)
- [ClientCredentialsFlow](interfaces/ClientCredentialsFlow.md)
- [HeaderFieldOptions](interfaces/HeaderFieldOptions.md)
- [HttpAuthBase](interfaces/HttpAuthBase.md)
- [HttpOperation](interfaces/HttpOperation.md)
- [HttpOperationBody](interfaces/HttpOperationBody.md)
- [HttpOperationParameters](interfaces/HttpOperationParameters.md)
- [HttpOperationRequestBody](interfaces/HttpOperationRequestBody.md)
- [HttpOperationResponse](interfaces/HttpOperationResponse.md)
- [HttpOperationResponseContent](interfaces/HttpOperationResponseContent.md)
- [HttpServer](interfaces/HttpServer.md)
- [HttpService](interfaces/HttpService.md)
- [ImplicitFlow](interfaces/ImplicitFlow.md)
- [MetadataInfo](interfaces/MetadataInfo.md)
- [MetadataInfoOptions](interfaces/MetadataInfoOptions.md)
- [OAuth2Scope](interfaces/OAuth2Scope.md)
- [Oauth2Auth](interfaces/Oauth2Auth.md)
- [OperationParameterOptions](interfaces/OperationParameterOptions.md)
- [PasswordFlow](interfaces/PasswordFlow.md)
- [PathParameterOptions](interfaces/PathParameterOptions.md)
- [QueryParameterOptions](interfaces/QueryParameterOptions.md)
- [RouteOptions](interfaces/RouteOptions.md)
- [RoutePath](interfaces/RoutePath.md)
- [RouteProducerResult](interfaces/RouteProducerResult.md)
- [RouteResolutionOptions](interfaces/RouteResolutionOptions.md)
- [ServiceAuthentication](interfaces/ServiceAuthentication.md)

### Type Aliases

- [HttpAuth](index.md#httpauth)
- [HttpOperationParameter](index.md#httpoperationparameter)
- [HttpVerb](index.md#httpverb)
- [OAuth2Flow](index.md#oauth2flow)
- [OAuth2FlowType](index.md#oauth2flowtype)
- [OperationContainer](index.md#operationcontainer)
- [OperationDetails](index.md#operationdetails)
- [OperationVerbSelector](index.md#operationverbselector)
- [RouteProducer](index.md#routeproducer)
- [StatusCode](index.md#statuscode)

### Variables

- [namespace](index.md#namespace)

### Functions

- [$body](index.md#$body)
- [$delete](index.md#$delete)
- [$get](index.md#$get)
- [$head](index.md#$head)
- [$header](index.md#$header)
- [$includeInapplicableMetadataInPayload](index.md#$includeinapplicablemetadatainpayload)
- [$onValidate](index.md#$onvalidate)
- [$patch](index.md#$patch)
- [$path](index.md#$path)
- [$plainData](index.md#$plaindata)
- [$post](index.md#$post)
- [$put](index.md#$put)
- [$query](index.md#$query)
- [$route](index.md#$route)
- [$server](index.md#$server)
- [$sharedRoute](index.md#$sharedroute)
- [$statusCode](index.md#$statuscode)
- [$useAuth](index.md#$useauth)
- [DefaultRouteProducer](index.md#defaultrouteproducer)
- [createMetadataInfo](index.md#createmetadatainfo)
- [gatherMetadata](index.md#gathermetadata)
- [getAllHttpServices](index.md#getallhttpservices)
- [getAllRoutes](index.md#getallroutes)
- [getAuthentication](index.md#getauthentication)
- [getContentTypes](index.md#getcontenttypes)
- [getHeaderFieldName](index.md#getheaderfieldname)
- [getHeaderFieldOptions](index.md#getheaderfieldoptions)
- [getHttpOperation](index.md#gethttpoperation)
- [getHttpService](index.md#gethttpservice)
- [getOperationParameters](index.md#getoperationparameters)
- [getOperationVerb](index.md#getoperationverb)
- [getPathParamName](index.md#getpathparamname)
- [getPathParamOptions](index.md#getpathparamoptions)
- [getQueryParamName](index.md#getqueryparamname)
- [getQueryParamOptions](index.md#getqueryparamoptions)
- [getRequestVisibility](index.md#getrequestvisibility)
- [getResponsesForOperation](index.md#getresponsesforoperation)
- [getRouteOptionsForNamespace](index.md#getrouteoptionsfornamespace)
- [getRoutePath](index.md#getroutepath)
- [getRouteProducer](index.md#getrouteproducer)
- [getServers](index.md#getservers)
- [getStatusCodeDescription](index.md#getstatuscodedescription)
- [getStatusCodes](index.md#getstatuscodes)
- [getVisibilitySuffix](index.md#getvisibilitysuffix)
- [includeInapplicableMetadataInPayload](index.md#includeinapplicablemetadatainpayload)
- [includeInterfaceRoutesInNamespace](index.md#includeinterfaceroutesinnamespace)
- [isApplicableMetadata](index.md#isapplicablemetadata)
- [isApplicableMetadataOrBody](index.md#isapplicablemetadataorbody)
- [isBody](index.md#isbody)
- [isContentTypeHeader](index.md#iscontenttypeheader)
- [isHeader](index.md#isheader)
- [isMetadata](index.md#ismetadata)
- [isOverloadSameEndpoint](index.md#isoverloadsameendpoint)
- [isPathParam](index.md#ispathparam)
- [isQueryParam](index.md#isqueryparam)
- [isSharedRoute](index.md#issharedroute)
- [isStatusCode](index.md#isstatuscode)
- [isVisible](index.md#isvisible)
- [listHttpOperationsIn](index.md#listhttpoperationsin)
- [reportIfNoRoutes](index.md#reportifnoroutes)
- [resolvePathAndParameters](index.md#resolvepathandparameters)
- [setAuthentication](index.md#setauthentication)
- [setRoute](index.md#setroute)
- [setRouteOptionsForNamespace](index.md#setrouteoptionsfornamespace)
- [setRouteProducer](index.md#setrouteproducer)
- [setSharedRoute](index.md#setsharedroute)
- [setStatusCode](index.md#setstatuscode)
- [validateRouteUnique](index.md#validaterouteunique)

## Type Aliases

### HttpAuth

Ƭ **HttpAuth**: [`BasicAuth`](interfaces/BasicAuth.md) \| [`BearerAuth`](interfaces/BearerAuth.md) \| [`ApiKeyAuth`](interfaces/ApiKeyAuth.md)<`ApiKeyLocation`, `string`\> \| [`Oauth2Auth`](interfaces/Oauth2Auth.md)<[`OAuth2Flow`](index.md#oauth2flow)[]\>

___

### HttpOperationParameter

Ƭ **HttpOperationParameter**: [`HeaderFieldOptions`](interfaces/HeaderFieldOptions.md) \| [`QueryParameterOptions`](interfaces/QueryParameterOptions.md) \| [`PathParameterOptions`](interfaces/PathParameterOptions.md) & { `param`: `ModelProperty`  }

___

### HttpVerb

Ƭ **HttpVerb**: ``"get"`` \| ``"put"`` \| ``"post"`` \| ``"patch"`` \| ``"delete"`` \| ``"head"``

___

### OAuth2Flow

Ƭ **OAuth2Flow**: [`AuthorizationCodeFlow`](interfaces/AuthorizationCodeFlow.md) \| [`ImplicitFlow`](interfaces/ImplicitFlow.md) \| [`PasswordFlow`](interfaces/PasswordFlow.md) \| [`ClientCredentialsFlow`](interfaces/ClientCredentialsFlow.md)

___

### OAuth2FlowType

Ƭ **OAuth2FlowType**: [`OAuth2Flow`](index.md#oauth2flow)[``"type"``]

___

### OperationContainer

Ƭ **OperationContainer**: `Namespace` \| `Interface`

___

### OperationDetails

Ƭ **OperationDetails**: [`HttpOperation`](interfaces/HttpOperation.md)

**`Deprecated`**

use `HttpOperation`. To remove in November 2022 release.

___

### OperationVerbSelector

Ƭ **OperationVerbSelector**: (`program`: `Program`, `operation`: `Operation`) => [`HttpVerb`](index.md#httpverb) \| `undefined`

#### Type declaration

▸ (`program`, `operation`): [`HttpVerb`](index.md#httpverb) \| `undefined`

##### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `operation` | `Operation` |

##### Returns

[`HttpVerb`](index.md#httpverb) \| `undefined`

___

### RouteProducer

Ƭ **RouteProducer**: (`program`: `Program`, `operation`: `Operation`, `parentSegments`: `string`[], `overloadBase`: [`HttpOperation`](interfaces/HttpOperation.md) \| `undefined`, `options`: [`RouteOptions`](interfaces/RouteOptions.md)) => `DiagnosticResult`<[`RouteProducerResult`](interfaces/RouteProducerResult.md)\>

#### Type declaration

▸ (`program`, `operation`, `parentSegments`, `overloadBase`, `options`): `DiagnosticResult`<[`RouteProducerResult`](interfaces/RouteProducerResult.md)\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `operation` | `Operation` |
| `parentSegments` | `string`[] |
| `overloadBase` | [`HttpOperation`](interfaces/HttpOperation.md) \| `undefined` |
| `options` | [`RouteOptions`](interfaces/RouteOptions.md) |

##### Returns

`DiagnosticResult`<[`RouteProducerResult`](interfaces/RouteProducerResult.md)\>

___

### StatusCode

Ƭ **StatusCode**: \`${number}\` \| ``"*"``

## Variables

### namespace

• `Const` **namespace**: ``"TypeSpec.Http"``

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

▸ **$header**(`context`, `entity`, `headerNameOrOptions?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `ModelProperty` |
| `headerNameOrOptions?` | `Model` \| `StringLiteral` |

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

### $onValidate

▸ **$onValidate**(`program`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |

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
| `entity` | `Model` |

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

▸ **$query**(`context`, `entity`, `queryNameOrOptions?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `ModelProperty` |
| `queryNameOrOptions?` | `Model` \| `StringLiteral` |

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

### $sharedRoute

▸ **$sharedRoute**(`context`, `entity`): `void`

`@sharedRoute` marks the operation as sharing a route path with other operations.

When an operation is marked with `@sharedRoute`, it enables other operations to share the same
route path as long as those operations are also marked with `@sharedRoute`.

`@sharedRoute` can only be applied directly to operations.

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Operation` |

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

### DefaultRouteProducer

▸ **DefaultRouteProducer**(`program`, `operation`, `parentSegments`, `overloadBase`, `options`): `DiagnosticResult`<[`RouteProducerResult`](interfaces/RouteProducerResult.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `operation` | `Operation` |
| `parentSegments` | `string`[] |
| `overloadBase` | `undefined` \| [`HttpOperation`](interfaces/HttpOperation.md) |
| `options` | [`RouteOptions`](interfaces/RouteOptions.md) |

#### Returns

`DiagnosticResult`<[`RouteProducerResult`](interfaces/RouteProducerResult.md)\>

___

### createMetadataInfo

▸ **createMetadataInfo**(`program`, `options?`): [`MetadataInfo`](interfaces/MetadataInfo.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `options?` | [`MetadataInfoOptions`](interfaces/MetadataInfoOptions.md) |

#### Returns

[`MetadataInfo`](interfaces/MetadataInfo.md)

___

### gatherMetadata

▸ **gatherMetadata**(`program`, `diagnostics`, `type`, `visibility`, `isMetadataCallback?`, `rootMapOut?`): `Set`<`ModelProperty`\>

Walks the given type and collects all applicable metadata and `@body`
properties recursively.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `program` | `Program` | `undefined` | - |
| `diagnostics` | `DiagnosticCollector` | `undefined` | - |
| `type` | `Type` | `undefined` | - |
| `visibility` | [`Visibility`](enums/Visibility.md) | `undefined` | - |
| `isMetadataCallback` | (`program`: `Program`, `property`: `ModelProperty`) => `boolean` | `isMetadata` | Determines if a property is metadata. A property is defined to be metadata if it is marked `@header`, `@query`, `@path`, or `@statusCode`. |
| `rootMapOut?` | `Map`<`ModelProperty`, `ModelProperty`\> | `undefined` | If provided, the map will be populated to link nested metadata properties to their root properties. |

#### Returns

`Set`<`ModelProperty`\>

___

### getAllHttpServices

▸ **getAllHttpServices**(`program`, `options?`): [[`HttpService`](interfaces/HttpService.md)[], readonly `Diagnostic`[]]

Returns all the services defined.

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `options?` | [`RouteResolutionOptions`](interfaces/RouteResolutionOptions.md) |

#### Returns

[[`HttpService`](interfaces/HttpService.md)[], readonly `Diagnostic`[]]

___

### getAllRoutes

▸ **getAllRoutes**(`program`, `options?`): [[`HttpOperation`](interfaces/HttpOperation.md)[], readonly `Diagnostic`[]]

**`Deprecated`**

use `getAllHttpServices` or `resolveHttpOperations` manually

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `options?` | [`RouteResolutionOptions`](interfaces/RouteResolutionOptions.md) |

#### Returns

[[`HttpOperation`](interfaces/HttpOperation.md)[], readonly `Diagnostic`[]]

___

### getAuthentication

▸ **getAuthentication**(`program`, `namespace`): [`ServiceAuthentication`](interfaces/ServiceAuthentication.md) \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `namespace` | `Namespace` |

#### Returns

[`ServiceAuthentication`](interfaces/ServiceAuthentication.md) \| `undefined`

___

### getContentTypes

▸ **getContentTypes**(`property`): [`string`[], readonly `Diagnostic`[]]

Resolve the content types from a model property by looking at the value.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `property` | `ModelProperty` | Model property |

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

### getHeaderFieldOptions

▸ **getHeaderFieldOptions**(`program`, `entity`): [`HeaderFieldOptions`](interfaces/HeaderFieldOptions.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Type` |

#### Returns

[`HeaderFieldOptions`](interfaces/HeaderFieldOptions.md)

___

### getHttpOperation

▸ **getHttpOperation**(`program`, `operation`, `options?`): [[`HttpOperation`](interfaces/HttpOperation.md), readonly `Diagnostic`[]]

Return the Http Operation details for a given TypeSpec operation.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | `Program` | - |
| `operation` | `Operation` | Operation |
| `options?` | [`RouteResolutionOptions`](interfaces/RouteResolutionOptions.md) | Optional option on how to resolve the http details. |

#### Returns

[[`HttpOperation`](interfaces/HttpOperation.md), readonly `Diagnostic`[]]

___

### getHttpService

▸ **getHttpService**(`program`, `serviceNamespace`, `options?`): [[`HttpService`](interfaces/HttpService.md), readonly `Diagnostic`[]]

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `serviceNamespace` | `Namespace` |
| `options?` | [`RouteResolutionOptions`](interfaces/RouteResolutionOptions.md) |

#### Returns

[[`HttpService`](interfaces/HttpService.md), readonly `Diagnostic`[]]

___

### getOperationParameters

▸ **getOperationParameters**(`program`, `operation`, `overloadBase?`, `knownPathParamNames?`, `options?`): [[`HttpOperationParameters`](interfaces/HttpOperationParameters.md), readonly `Diagnostic`[]]

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `program` | `Program` | `undefined` |
| `operation` | `Operation` | `undefined` |
| `overloadBase?` | [`HttpOperation`](interfaces/HttpOperation.md) | `undefined` |
| `knownPathParamNames` | `string`[] | `[]` |
| `options` | [`OperationParameterOptions`](interfaces/OperationParameterOptions.md) | `{}` |

#### Returns

[[`HttpOperationParameters`](interfaces/HttpOperationParameters.md), readonly `Diagnostic`[]]

___

### getOperationVerb

▸ **getOperationVerb**(`program`, `entity`): [`HttpVerb`](index.md#httpverb) \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Type` |

#### Returns

[`HttpVerb`](index.md#httpverb) \| `undefined`

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

### getPathParamOptions

▸ **getPathParamOptions**(`program`, `entity`): [`PathParameterOptions`](interfaces/PathParameterOptions.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Type` |

#### Returns

[`PathParameterOptions`](interfaces/PathParameterOptions.md)

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

### getQueryParamOptions

▸ **getQueryParamOptions**(`program`, `entity`): [`QueryParameterOptions`](interfaces/QueryParameterOptions.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Type` |

#### Returns

[`QueryParameterOptions`](interfaces/QueryParameterOptions.md)

___

### getRequestVisibility

▸ **getRequestVisibility**(`verb`): [`Visibility`](enums/Visibility.md)

Determines the visibility to use for a request with the given verb.

- GET | HEAD => Visibility.Query
- POST => Visibility.Update
- PUT => Visibility.Create | Update
- DELETE => Visibility.Delete

#### Parameters

| Name | Type |
| :------ | :------ |
| `verb` | [`HttpVerb`](index.md#httpverb) |

#### Returns

[`Visibility`](enums/Visibility.md)

___

### getResponsesForOperation

▸ **getResponsesForOperation**(`program`, `operation`): [[`HttpOperationResponse`](interfaces/HttpOperationResponse.md)[], readonly `Diagnostic`[]]

Get the responses for a given operation.

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `operation` | `Operation` |

#### Returns

[[`HttpOperationResponse`](interfaces/HttpOperationResponse.md)[], readonly `Diagnostic`[]]

___

### getRouteOptionsForNamespace

▸ **getRouteOptionsForNamespace**(`program`, `namespace`): [`RouteOptions`](interfaces/RouteOptions.md) \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `namespace` | `Namespace` |

#### Returns

[`RouteOptions`](interfaces/RouteOptions.md) \| `undefined`

___

### getRoutePath

▸ **getRoutePath**(`program`, `entity`): [`RoutePath`](interfaces/RoutePath.md) \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Interface` \| `Namespace` \| `Operation` |

#### Returns

[`RoutePath`](interfaces/RoutePath.md) \| `undefined`

___

### getRouteProducer

▸ **getRouteProducer**(`program`, `operation`): [`RouteProducer`](index.md#routeproducer)

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `operation` | `Operation` |

#### Returns

[`RouteProducer`](index.md#routeproducer)

___

### getServers

▸ **getServers**(`program`, `type`): [`HttpServer`](interfaces/HttpServer.md)[] \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `type` | `Namespace` |

#### Returns

[`HttpServer`](interfaces/HttpServer.md)[] \| `undefined`

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

▸ **getVisibilitySuffix**(`visibility`, `canonicalVisibility?`): `string`

Provides a naming suffix to create a unique name for a type with this
visibility.

The canonical visibility (default Visibility.Read) gets empty suffix,
otherwise visibilities are joined in pascal-case with `Or`. And `Item` is
if `Visibility.Item` is produced.

Examples (with canonicalVisibility = Visibility.Read):
 - Visibility.Read => ""
 - Visibility.Update => "Update"
 - Visibility.Create | Visibility.Update => "CreateOrUpdate"
 - Visibility.Create | Visibility.Item => "CreateItem"
 - Visibility.Create | Visibility.Update | Visibility.Item => "CreateOrUpdateItem"

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `visibility` | [`Visibility`](enums/Visibility.md) | `undefined` |
| `canonicalVisibility` | `undefined` \| [`Visibility`](enums/Visibility.md) | `Visibility.None` |

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

### includeInterfaceRoutesInNamespace

▸ **includeInterfaceRoutesInNamespace**(`program`, `target`, `sourceInterface`): `void`

**`Deprecated`**

DO NOT USE. For internal use only as a workaround.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | `Program` | Program |
| `target` | `Namespace` | Target namespace |
| `sourceInterface` | `string` | Interface that should be included in namespace. |

#### Returns

`void`

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
| `visibility` | [`Visibility`](enums/Visibility.md) | `undefined` |
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
| `visibility` | [`Visibility`](enums/Visibility.md) | `undefined` |
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
| `overload` | [`HttpOperation`](interfaces/HttpOperation.md) & { `overloading`: [`HttpOperation`](interfaces/HttpOperation.md)  } |

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

### isSharedRoute

▸ **isSharedRoute**(`program`, `operation`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `operation` | `Operation` |

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
| `visibility` | [`Visibility`](enums/Visibility.md) |

#### Returns

`boolean`

___

### listHttpOperationsIn

▸ **listHttpOperationsIn**(`program`, `container`, `options?`): [[`HttpOperation`](interfaces/HttpOperation.md)[], readonly `Diagnostic`[]]

Get all the Http Operation in the given container.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | `Program` | Program |
| `container` | [`OperationContainer`](index.md#operationcontainer) | Namespace or interface containing operations |
| `options?` | [`RouteResolutionOptions`](interfaces/RouteResolutionOptions.md) | Resolution options |

#### Returns

[[`HttpOperation`](interfaces/HttpOperation.md)[], readonly `Diagnostic`[]]

___

### reportIfNoRoutes

▸ **reportIfNoRoutes**(`program`, `routes`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `routes` | [`HttpOperation`](interfaces/HttpOperation.md)[] |

#### Returns

`void`

___

### resolvePathAndParameters

▸ **resolvePathAndParameters**(`program`, `operation`, `overloadBase`, `options`): `DiagnosticResult`<{ `parameters`: [`HttpOperationParameters`](interfaces/HttpOperationParameters.md) ; `path`: `string` ; `pathSegments`: `string`[]  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `operation` | `Operation` |
| `overloadBase` | `undefined` \| [`HttpOperation`](interfaces/HttpOperation.md) |
| `options` | [`RouteResolutionOptions`](interfaces/RouteResolutionOptions.md) |

#### Returns

`DiagnosticResult`<{ `parameters`: [`HttpOperationParameters`](interfaces/HttpOperationParameters.md) ; `path`: `string` ; `pathSegments`: `string`[]  }\>

___

### setAuthentication

▸ **setAuthentication**(`program`, `serviceNamespace`, `auth`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `serviceNamespace` | `Namespace` |
| `auth` | [`ServiceAuthentication`](interfaces/ServiceAuthentication.md) |

#### Returns

`void`

___

### setRoute

▸ **setRoute**(`context`, `entity`, `details`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Type` |
| `details` | [`RoutePath`](interfaces/RoutePath.md) |

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
| `options` | [`RouteOptions`](interfaces/RouteOptions.md) |

#### Returns

`void`

___

### setRouteProducer

▸ **setRouteProducer**(`program`, `operation`, `routeProducer`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `operation` | `Operation` |
| `routeProducer` | [`RouteProducer`](index.md#routeproducer) |

#### Returns

`void`

___

### setSharedRoute

▸ **setSharedRoute**(`program`, `operation`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `operation` | `Operation` |

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
| `operations` | [`HttpOperation`](interfaces/HttpOperation.md)[] |

#### Returns

`void`
