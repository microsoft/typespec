# Spec Project summary

### Authentication_ApiKey_invalid

- Endpoint: `get /authentication/api-key/invalid`

Expect error code 403 and error body:

```json
{
  "error": {
    "code": "InvalidApiKey",
    "message": "API key is invalid"
  }
}
```

### Authentication_ApiKey_valid

- Endpoint: `get /authentication/api-key/valid`

Expects header 'x-ms-api-key': 'valid-key'

### Authentication_Http_Custom_invalid

- Endpoint: `get /authentication/http/custom/invalid`

Expect error code 403 and error body:

```json
{
  "error": "invalid-api-key"
}
```

### Authentication_Http_Custom_valid

- Endpoint: `get /authentication/http/custom/valid`

Expects header 'Authorization': 'SharedAccessKey valid-key'

### Authentication_OAuth2_invalid

- Endpoint: `get /authentication/oauth2/invalid`

Expect error code 400 and error body:

```json
{
  "message": "Expected Bearer x but got Bearer y",
  "expected": "Bearer x",
  "actual": "Bearer y"
}
```

### Authentication_OAuth2_valid

- Endpoint: `get /authentication/oauth2/valid`

Expects header 'authorization': 'Bearer https://security.microsoft.com/.default'

### Authentication_Union_validKey

- Endpoint: `get /authentication/union/validkey`

Expects header 'x-ms-api-key': 'valid-key'

### Authentication_Union_validToken

- Endpoint: `get /authentication/union/validtoken`

Expects header 'authorization': 'Bearer https://security.microsoft.com/.default'

### Encode_Bytes_Header_base64

- Endpoint: `get /encode/bytes/header/base64`

Test base64 encode for bytes header.
Expected header:
value=dGVzdA== (base64 encode of test)

### Encode_Bytes_Header_base64url

- Endpoint: `get /encode/bytes/header/base64url`

Test base64url encode for bytes header.
Expected header:
value=dGVzdA (base64url encode of test)

### Encode_Bytes_Header_base64urlArray

- Endpoint: `get /encode/bytes/header/base64url-array`

Test base64url encode for bytes array header.
Expected header:
value=dGVzdA,dGVzdA

### Encode_Bytes_Header_default

- Endpoint: `get /encode/bytes/header/default`

Test default encode (base64) for bytes header.
Expected header:
value=dGVzdA== (base64 encode of test)

### Encode_Bytes_Property_base64

- Endpoint: `post /encode/bytes/property/base64`

Test operation with request and response model contains bytes properties with base64 encode.
Expected request body:

```json
{
  "value": "dGVzdA==" // base64 encode of test
}
```

Expected response body:

```json
{
  "value": "dGVzdA=="
}
```

### Encode_Bytes_Property_base64url

- Endpoint: `post /encode/bytes/property/base64url`

Test operation with request and response model contains bytes properties with base64url encode.
Expected request body:

```json
{
  "value": "dGVzdA" // base64url encode of test
}
```

Expected response body:

```json
{
  "value": "dGVzdA"
}
```

### Encode_Bytes_Property_base64urlArray

- Endpoint: `post /encode/bytes/property/base64url-array`

Test operation with request and response model contains bytes array properties with base64url encode.
Expected request body:

```json
{
  "value": ["dGVzdA", "dGVzdA"]
}
```

Expected response body:

```json
{
  "value": ["dGVzdA", "dGVzdA"]
}
```

### Encode_Bytes_Property_default

- Endpoint: `post /encode/bytes/property/default`

Test operation with request and response model contains bytes properties with default encode (base64).
Expected request body:

```json
{
  "value": "dGVzdA==" // base64 encode of test
}
```

Expected response body:

```json
{
  "value": "dGVzdA=="
}
```

### Encode_Bytes_Query_base64

- Endpoint: `get /encode/bytes/query/base64`

Test base64 encode for bytes query parameter.
Expected query parameter:
value=dGVzdA== (base64 encode of test)

### Encode_Bytes_Query_base64url

- Endpoint: `get /encode/bytes/query/base64url`

Test base64url encode for bytes query parameter.
Expected query parameter:
value=dGVzdA (base64url encode of test)

### Encode_Bytes_Query_base64urlArray

- Endpoint: `get /encode/bytes/query/base64url-array`

Test base64url encode for bytes array query parameter.
Expected query parameter:
value=dGVzdA, dGVzdA

### Encode_Bytes_Query_default

- Endpoint: `get /encode/bytes/query/default`

Test default encode (base64) for bytes query parameter.
Expected query parameter:
value=dGVzdA== (base64 encode of test)

### Encode_Bytes_RequestBody_base64

- Endpoint: `post /encode/bytes/body/request/base64`

Test base64 encode for bytes body.
Expected body:
"dGVzdA==" (base64 encode of test, in JSON string)

### Encode_Bytes_RequestBody_base64url

- Endpoint: `post /encode/bytes/body/request/base64url`

Test base64url encode for bytes body.
Expected body:
"dGVzdA" (base64url encode of test, in JSON string)

### Encode_Bytes_RequestBody_customContentType

- Endpoint: `post /encode/bytes/body/request/custom-content-type`

When content type is a custom type(image/png here) and body is `bytes` the payload is a binary file.
File should match packages/http-specs/assets/image.png.

### Encode_Bytes_RequestBody_default

- Endpoint: `post /encode/bytes/body/request/default`

When content type is not defined and body is `bytes` the payload is a binary stream.
Stream should match packages/http-specs/assets/image.png file.

### Encode_Bytes_RequestBody_octetStream

- Endpoint: `post /encode/bytes/body/request/octet-stream`

When content type is application/octet-stream and body is `bytes` the payload is a binary stream.
Stream should match packages/http-specs/assets/image.png file.

### Encode_Bytes_ResponseBody_base64

- Endpoint: `get /encode/bytes/body/response/base64`

Test base64 encode for bytes body.
Expected body:
"dGVzdA==" (base64 encode of test, in JSON string)

### Encode_Bytes_ResponseBody_base64url

- Endpoint: `get /encode/bytes/body/response/base64url`

Test base64url encode for bytes body.
Expected body:
"dGVzdA" (base64url encode of test, in JSON string)

### Encode_Bytes_ResponseBody_customContentType

- Endpoint: `get /encode/bytes/body/response/custom-content-type`

When content type is a custom type(image/png here) and body is `bytes` the payload is a binary file.
File should match packages/http-specs/assets/image.png

### Encode_Bytes_ResponseBody_default

- Endpoint: `get /encode/bytes/body/response/default`

When content type is not defined and body is `bytes` the payload is a binary stream.
Stream should match packages/http-specs/assets/image.png file.

### Encode_Bytes_ResponseBody_octetStream

- Endpoint: `get /encode/bytes/body/response/octet-stream`

When content type is application/octet-stream and body is `bytes` the payload is a binary stream.
Stream should match packages/http-specs/assets/image.png file.

### Encode_Datetime_Header_default

- Endpoint: `get /encode/datetime/header/default`

Test default encode (rfc7231) for datetime header.
Expected header:
value=Fri, 26 Aug 2022 14:38:00 GMT

### Encode_Datetime_Header_rfc3339

- Endpoint: `get /encode/datetime/header/rfc3339`

Test rfc3339 encode for datetime header.
Expected header:
value=2022-08-26T18:38:00.000Z

### Encode_Datetime_Header_rfc7231

- Endpoint: `get /encode/datetime/header/rfc7231`

Test rfc7231 encode for datetime header.
Expected header:
value=Fri, 26 Aug 2022 14:38:00 GMT

### Encode_Datetime_Header_unixTimestamp

- Endpoint: `get /encode/datetime/header/unix-timestamp`

Test unixTimestamp encode for datetime header.
Expected header:
value=1686566864

### Encode_Datetime_Header_unixTimestampArray

- Endpoint: `get /encode/datetime/header/unix-timestamp-array`

Test unixTimestamp encode for datetime array header.
Expected header:
value=1686566864,1686734256

### Encode_Datetime_Property_default

- Endpoint: `post /encode/datetime/property/default`

Test operation with request and response model contains datetime property with default encode (rfc3339).
Expected request body:

```json
{
  "value": "2022-08-26T18:38:00.000Z"
}
```

Expected response body:

```json
{
  "value": "2022-08-26T18:38:00.000Z"
}
```

### Encode_Datetime_Property_rfc3339

- Endpoint: `post /encode/datetime/property/rfc3339`

Test operation with request and response model contains datetime property with rfc3339 encode.
Expected request body:

```json
{
  "value": "2022-08-26T18:38:00.000Z"
}
```

Expected response body:

```json
{
  "value": "2022-08-26T18:38:00.000Z"
}
```

### Encode_Datetime_Property_rfc7231

- Endpoint: `post /encode/datetime/property/rfc7231`

Test operation with request and response model contains datetime property with rfc7231 encode.
Expected request body:

```json
{
  "value": "Fri, 26 Aug 2022 14:38:00 GMT"
}
```

Expected response body:

```json
{
  "value": "Fri, 26 Aug 2022 14:38:00 GMT"
}
```

### Encode_Datetime_Property_unixTimestamp

- Endpoint: `post /encode/datetime/property/unix-timestamp`

Test operation with request and response model contains datetime property with unixTimestamp encode.
Expected request body:

```json
{
  "value": 1686566864
}
```

Expected response body:

```json
{
  "value": 1686566864
}
```

### Encode_Datetime_Property_unixTimestampArray

- Endpoint: `post /encode/datetime/property/unix-timestamp-array`

Test operation with request and response model contains datetime array property with unixTimestamp encode.
Expected request body:f

```json
{
  "value": [1686566864, 1686734256]
}
```

Expected response body:

```json
{
  "value": [1686566864, 1686734256]
}
```

### Encode_Datetime_Query_default

- Endpoint: `get /encode/datetime/query/default`

Test default encode (rfc3339) for datetime query parameter.
Expected query parameter:
value=2022-08-26T18:38:00.000Z

### Encode_Datetime_Query_rfc3339

- Endpoint: `get /encode/datetime/query/rfc3339`

Test rfc3339 encode for datetime query parameter.
Expected query parameter:
value=2022-08-26T18:38:00.000Z

### Encode_Datetime_Query_rfc7231

- Endpoint: `get /encode/datetime/query/rfc7231`

Test rfc7231 encode for datetime query parameter.
Expected query parameter:
value=Fri, 26 Aug 2022 14:38:00 GMT

### Encode_Datetime_Query_unixTimestamp

- Endpoint: `get /encode/datetime/query/unix-timestamp`

Test unixTimestamp encode for datetime query parameter.
Expected query parameter:
value=1686566864

### Encode_Datetime_Query_unixTimestampArray

- Endpoint: `get /encode/datetime/query/unix-timestamp-array`

Test unixTimestamp encode for datetime array query parameter.
Expected query parameter:
value=1686566864, 1686734256

### Encode_Datetime_ResponseHeader_default

- Endpoint: `get /encode/datetime/responseheader/default`

Test default encode (rfc7231) for datetime header.
Expected response header:
value=Fri, 26 Aug 2022 14:38:00 GMT

### Encode_Datetime_ResponseHeader_rfc3339

- Endpoint: `get /encode/datetime/responseheader/rfc3339`

Test rfc3339 encode for datetime header.
Expected response header:
value=2022-08-26T18:38:00.000Z

### Encode_Datetime_ResponseHeader_rfc7231

- Endpoint: `get /encode/datetime/responseheader/rfc7231`

Test rfc7231 encode for datetime header.
Expected response header:
value=Fri, 26 Aug 2022 14:38:00 GMT

### Encode_Datetime_ResponseHeader_unixTimestamp

- Endpoint: `get /encode/datetime/responseheader/unix-timestamp`

Test unixTimestamp encode for datetime header.
Expected response header:
value=1686566864

### Encode_Duration_Header_default

- Endpoint: `get /encode/duration/header/default`

Test default encode for a duration header.
Expected header `input=P40D`

### Encode_Duration_Header_float64Seconds

- Endpoint: `get /encode/duration/header/float64-seconds`

Test float64 seconds encode for a duration header.
Expected header `duration: 35.625`

### Encode_Duration_Header_floatSeconds

- Endpoint: `get /encode/duration/header/float-seconds`

Test float seconds encode for a duration header.
Expected header `duration: 35.625`

### Encode_Duration_Header_int32Seconds

- Endpoint: `get /encode/duration/header/int32-seconds`

Test int32 seconds encode for a duration header.
Expected header `duration: 36`

### Encode_Duration_Header_iso8601

- Endpoint: `get /encode/duration/header/iso8601`

Test iso8601 encode for a duration header.
Expected header `duration: P40D`

### Encode_Duration_Header_iso8601Array

- Endpoint: `get /encode/duration/header/iso8601-array`

Test iso8601 encode for a duration array header.
Expected header `duration: [P40D,P50D]`

### Encode_Duration_Property_default

- Endpoint: `post /encode/duration/property/default`

Test operation with request and response model contains a duration property with default encode.
Expected request body:

```json
{
  "value": "P40D"
}
```

Expected response body:

```json
{
  "value": "P40D"
}
```

### Encode_Duration_Property_float64Seconds

- Endpoint: `get /encode/duration/property/float64-seconds`

Test operation with request and response model contains a duration property with float64 seconds encode.
Expected request body:

```json
{
  "value": 35.625
}
```

Expected response body:

```json
{
  "value": 35.625
}
```

### Encode_Duration_Property_floatSeconds

- Endpoint: `get /encode/duration/property/float-seconds`

Test operation with request and response model contains a duration property with float seconds encode.
Expected request body:

```json
{
  "value": 35.625
}
```

Expected response body:

```json
{
  "value": 35.625
}
```

### Encode_Duration_Property_floatSecondsArray

- Endpoint: `get /encode/duration/property/float-seconds-array`

Test operation with request and response model contains an array property which elements are duration with float seconds encode.
Expected request body:

```json
{
  "value": [35.625, 46.75]
}
```

Expected response body:

```json
{
  "value": [35.625, 46.75]
}
```

### Encode_Duration_Property_int32Seconds

- Endpoint: `get /encode/duration/property/int32-seconds`

Test operation with request and response model contains a duration property with int32 seconds encode.
Expected request body:

```json
{
  "value": 36
}
```

Expected response body:

```json
{
  "value": 36
}
```

### Encode_Duration_Property_iso8601

- Endpoint: `post /encode/duration/property/iso8601`

Test operation with request and response model contains a duration property with iso8601 encode.
Expected request body:

```json
{
  "value": "P40D"
}
```

Expected response body:

```json
{
  "value": "P40D"
}
```

### Encode_Duration_Query_default

- Endpoint: `get /encode/duration/query/default`

Test default encode for a duration parameter.
Expected query parameter `input=P40D`

### Encode_Duration_Query_float64Seconds

- Endpoint: `get /encode/duration/query/float64-seconds`

Test float64 seconds encode for a duration parameter.
Expected query parameter `input=35.625`

### Encode_Duration_Query_floatSeconds

- Endpoint: `get /encode/duration/query/float-seconds`

Test float seconds encode for a duration parameter.
Expected query parameter `input=35.625`

### Encode_Duration_Query_int32Seconds

- Endpoint: `get /encode/duration/query/int32-seconds`

Test int32 seconds encode for a duration parameter.
Expected query parameter `input=36`

### Encode_Duration_Query_int32SecondsArray

- Endpoint: `get /encode/duration/query/int32-seconds-array`

Test int32 seconds encode for a duration array parameter.
Expected query parameter `input=36,47`

### Encode_Duration_Query_iso8601

- Endpoint: `get /encode/duration/query/iso8601`

Test iso8601 encode for a duration parameter.
Expected query parameter `input=P40D`

### Encode_Numeric_Property_safeintAsString

- Endpoint: `post /encode/numeric/property/safeint`

Test operation with request and response model contains property of safeint type with string encode.
Expected request body:

```json
{
  "value": "10000000000"
}
```

Expected response body:

```json
{
  "value": "10000000000"
}
```

### Encode_Numeric_Property_uint32AsStringOptional

- Endpoint: `post /encode/numeric/property/uint32`

Test operation with request and response model contains property of uint32 type with string encode.
Expected request body:

```json
{
  "value": "1"
}
```

Expected response body:

```json
{
  "value": "1"
}
```

### Encode_Numeric_Property_uint8AsString

- Endpoint: `post /encode/numeric/property/uint8`

Test operation with request and response model contains property of uint8 type with string encode.
Expected request body:

```json
{
  "value": "255"
}
```

Expected response body:

```json
{
  "value": "255"
}
```

### Parameters_Basic_ExplicitBody_simple

- Endpoint: `put /parameters/basic/explicit-body/simple`

Test case for simple explicit body.

Should generate request body model named `User`.
Should generate an operation like below:

```
spreadAsRequestBody(bodyParameter: BodyParameter)
```

Note the parameter name is guessed from the model name and it may vary by language.

Expected request body:

```json
{ "name": "foo" }
```

### Parameters_Basic_ImplicitBody_simple

- Endpoint: `put /parameters/basic/implicit-body/simple`

Test case for simple implicit body.

Should generate an operation like below:

```
simple(name: string)
```

Expected request body:

```json
{ "name": "foo" }
```

### Parameters_BodyOptionality_OptionalExplicit

- Endpoints:
  - `post /parameters/body-optionality/optional-explicit/set`
  - `post /parameters/body-optionality/optional-explicit/omit`

Scenario defining how an explicit optional body parameter is specified.

Expected request body for `set`

```json
{ "name": "foo" }
```

Expected no request body for `omit`

### Parameters_BodyOptionality_requiredExplicit

- Endpoint: `post /parameters/body-optionality/required-explicit`

Scenario defining how an explicit required body parameter is specified.

Expected request body:

```json
{ "name": "foo" }
```

### Parameters_BodyOptionality_requiredImplicit

- Endpoint: `post /parameters/body-optionality/required-implicit`

Scenario defining how an implicit required body parameter is specified.

Expected request body:

```json
{ "name": "foo" }
```

### Parameters_CollectionFormat_Header_csv

- Endpoint: `get /parameters/collection-format/header/csv`

This test is testing sending a csv collection format array header parameters

### Parameters_CollectionFormat_Query_csv

- Endpoint: `get /parameters/collection-format/query/csv`

This test is testing sending a csv collection format array query parameters

### Parameters_CollectionFormat_Query_multi

- Endpoint: `get /parameters/collection-format/query/multi`

This test is testing sending a multi collection format array query parameters

### Parameters_CollectionFormat_Query_pipes

- Endpoint: `get /parameters/collection-format/query/pipes`

This test is testing sending a pipes collection format array query parameters

### Parameters_CollectionFormat_Query_ssv

- Endpoint: `get /parameters/collection-format/query/ssv`

This test is testing sending a ssv collection format array query parameters

### Parameters_Spread_Alias_spreadAsRequestBody

- Endpoint: `put /parameters/spread/alias/request-body`

Test case for spread alias.

Should not generate any model named `BodyParameter`.
Should generate an operation like:

```
spreadAsRequestBody(name: string)
```

Expected request body:

```json
{ "name": "foo" }
```

### Parameters_Spread_Alias_spreadAsRequestParameter

- Endpoint: `put /parameters/spread/alias/request-parameter/{id}`

Test case for spread alias with path and header parameter.

Should not generate any model named `RequestParameter`.
Should generate an operation like below:

```
spreadAsRequestParameter(id: string, x_ms_test_header: string, name: string)
```

Note the parameter name may be normalized and vary by language.

Expected path parameter: id="1"
Expected header parameter: x-ms-test-header="bar"
Expected request body:

```json
{ "name": "foo" }
```

### Parameters_Spread_Alias_spreadParameterWithInnerAlias

- Endpoint: `post /parameters/spread/alias/inner-alias-parameter`

Test case for spread alias with contains another alias property as body.

Should not generate any model named `InnerAlias` and `InnerAliasParameter`.
Should generate an operation like below:

```
spreadParameterWithInnerAlias(id: string, name: string, age: int32, x_ms_test_header: string)
```

Note the parameter name is guessed from the model name and it may vary by language.
Expected path parameter: id="1"
Expected header parameter: x-ms-test-header="bar"
Expected request body:

```json
{
  "name": "foo",
  "age": 1
}
```

### Parameters_Spread_Alias_spreadParameterWithInnerModel

- Endpoint: `post /parameters/spread/alias/inner-model-parameter/{id}`

Test case for spread alias.

Should not generate any model named `InnerModel`.
Should not generate any model named `InnerModelParameter`.
Should generate an operation like:

```
spreadParameterWithInnerModel(id: string, x_ms_test_header: string, name: string)
```

Note the parameter name is guessed from the model name and it may vary by language.

Expected path parameter: id="1"
Expected header parameter: x-ms-test-header="bar"
Expected request body:

```json
{ "name": "foo" }
```

### Parameters_Spread_Alias_spreadWithMultipleParameters

- Endpoint: `put /parameters/spread/alias/multiple-parameters/{id}`

Test case for spread alias including 6 parameters. May handle as property bag for these parameters.

Should not generate any model named `MultipleRequestParameters`.
Since it contains both optional properties and required properties, the method signature might vary across different languages.
Note it's also acceptable if some languages handle it as property bag.

Expected path parameter: id="1"
Expected header parameter: x-ms-test-header="bar"
Expected request body:

```json
{
  "requiredString": "foo",
  "optionalInt": 1,
  "requiredIntList": [1, 2],
  "optionalStringList": ["foo", "bar"]
}
```

### Parameters_Spread_Model_spreadAsRequestBody

- Endpoint: `put /parameters/spread/model/request-body`

Test case for spread named model.

Should not generate request body model named `BodyParameter`.
Should generate an operation like below:

```
spreadAsRequestBody(name: string)
```

Note the parameter name is guessed from the model name and it may vary by language.

Expected request body:

```json
{ "name": "foo" }
```

### Parameters_Spread_Model_spreadCompositeRequest

- Endpoint: `put /parameters/spread/model/composite-request/{name}`

Test case for spread model with all http request decorator.

Should generate request body model named `BodyParameter`.
Should not generate model named `CompositeRequest`.
Should generate an operation like below:

```
spreadCompositeRequest(name: string, testHeader: string, bodyParameter: BodyParameter)
```

Note the parameter name is guessed from the model name and it may vary by language.

Expected path parameter: name="foo"
Expected header parameter: testHeader="bar"
Expected request body:

```json
{ "name": "foo" }
```

### Parameters_Spread_Model_spreadCompositeRequestMix

- Endpoint: `put /parameters/spread/model/composite-request-mix/{name}`

Test case for spread model with non-body http request decorator.

Should not generate model named `CompositeRequestMix`.
Should generate an operation like below:

```
spreadCompositeRequestMix(name: string, testHeader: string, prop: string)
```

Note the parameter name is guessed from the model name and it may vary by language.

Expected path parameter: name="foo"
Expected header parameter: testHeader="bar"
Expected request body:

```json
{ "prop": "foo" }
```

### Parameters_Spread_Model_spreadCompositeRequestOnlyWithBody

- Endpoint: `put /parameters/spread/model/composite-request-only-with-body`

Test case for spread model only with `@body` property.

Should generate request body model named `BodyParameter`.
Should not generate model named `CompositeRequestOnlyWithBody`.
Should generate an operation like below:

```
spreadCompositeRequestOnlyWithBody(bodyParameter: BodyParameter)
```

Note the parameter name is guessed from the model name and it may vary by language.

Expected request body:

```json
{ "name": "foo" }
```

### Parameters_Spread_Model_spreadCompositeRequestWithoutBody

- Endpoint: `put /parameters/spread/model/composite-request-without-body/{name}`

Test case for spread model without `@body` property.

Should not generate model named `CompositeRequestOnlyWithBody`.
Should generate an operation like below:

```
spreadCompositeRequestWithoutBody(name: string, testHeader: string)
```

Expected path parameter: name="foo"
Expected header parameter: testHeader="bar"

### Payload_ContentNegotiation_DifferentBody

- Endpoints:
  - `get /content-negotiation/different-body`
  - `get /content-negotiation/different-body`

Scenario that a different payload depending on the accept header.

- application/json return a png image in a Json object
- image/png return the png image

### Payload_ContentNegotiation_SameBody

- Endpoints:
  - `get /content-negotiation/same-body`
  - `get /content-negotiation/same-body`

Scenario that returns a different file encoding depending on the accept header.

- image/png return a png image
- image/jpeg return a jpeg image

### Payload_JsonMergePatch_createResource

- Endpoint: `put /json-merge-patch/create/resource`

Expected input body:

```json
{
  "name": "Madge",
  "description": "desc",
  "map": {
    "key": {
      "name": "InnerMadge",
      "description": "innerDesc"
    }
  },
  "array": [
    {
      "name": "InnerMadge",
      "description": "innerDesc"
    }
  ],
  "intValue": 1,
  "floatValue": 1.1,
  "innerModel": {
    "name": "InnerMadge",
    "description": "innerDesc"
  },
  "intArray": [1, 2, 3]
}
```

Expected response body:

```json
{
  "name": "Madge",
  "description": "desc",
  "map": {
    "key": {
      "name": "InnerMadge",
      "description": "innerDesc"
    }
  },
  "array": [
    {
      "name": "InnerMadge",
      "description": "innerDesc"
    }
  ],
  "intValue": 1,
  "floatValue": 1.1,
  "innerModel": {
    "name": "InnerMadge",
    "description": "innerDesc"
  },
  "intArray": [1, 2, 3]
}
```

### Payload_JsonMergePatch_updateOptionalResource

- Endpoint: `patch /json-merge-patch/update/resource/optional`

Should serialize null values with merge-patch+json enabled.

Expected input body:

```json
{
  "description": null,
  "map": {
    "key": {
      "description": null
    },
    "key2": null
  },
  "array": null,
  "intValue": null,
  "floatValue": null,
  "innerModel": null,
  "intArray": null
}
```

Expected response body:

```json
{
  "name": "Madge",
  "map": {
    "key": {
      "name": "InnerMadge"
    }
  }
}
```

### Payload_JsonMergePatch_updateResource

- Endpoint: `patch /json-merge-patch/update/resource`

Should serialize null values with merge-patch+json enabled.

Expected input body:

```json
{
  "description": null,
  "map": {
    "key": {
      "description": null
    },
    "key2": null
  },
  "array": null,
  "intValue": null,
  "floatValue": null,
  "innerModel": null,
  "intArray": null
}
```

Expected response body:

```json
{
  "name": "Madge",
  "map": {
    "key": {
      "name": "InnerMadge"
    }
  }
}
```

### Payload_MediaType_StringBody_getAsJson

- Endpoint: `get /payload/media-type/string-body/getAsJson`

Expected response body is "foo".

### Payload_MediaType_StringBody_getAsText

- Endpoint: `get /payload/media-type/string-body/getAsText`

Expected response body is a string '{cat}'.

### Payload_MediaType_StringBody_sendAsJson

- Endpoint: `post /payload/media-type/string-body/sendAsJson`

Expected request body is "foo".

### Payload_MediaType_StringBody_sendAsText

- Endpoint: `post /payload/media-type/string-body/sendAsText`

Expected request body is a string '{cat}'.

### Payload_MultiPart_FormData_anonymousModel

- Endpoint: `post /multipart/form-data/anonymous-model`

Expect request (

- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.4, content-type of file part shall be labeled with
  appropriate media type, server will check it; content-type of other parts is optional, server will ignore it.
- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.2, filename of file part SHOULD be supplied.
  If there are duplicated filename in same filedName, server can't parse them all.
  ):

```
POST /multipart/form-data/anonymous-model HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="profileImage"; filename="<any-name-is-ok>"
Content-Type: application/octet-stream;

{…file content of .jpg file…}
--abcde12345--
```

### Payload_MultiPart_FormData_basic

- Endpoint: `post /multipart/form-data/mixed-parts`

Expect request (

- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.4, content-type of file part shall be labeled with
  appropriate media type, server will check it; content-type of other parts is optional, server will ignore it.
- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.2, filename of file part SHOULD be supplied.
  If there are duplicated filename in same fieldName, server can't parse them all.
  ):

```
POST /upload HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="id"
Content-Type: text/plain

123
--abcde12345
Content-Disposition: form-data; name="profileImage"; filename="<any-or-no-name-is-ok>"
Content-Type: application/octet-stream;

{…file content of .jpg file…}
--abcde12345--
```

### Payload_MultiPart_FormData_binaryArrayParts

- Endpoint: `post /multipart/form-data/binary-array-parts`

Expect request (

- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.4, content-type of file part shall be labeled with
  appropriate media type, server will check it; content-type of other parts is optional, server will ignore it.
- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.2, filename of file part SHOULD be supplied.
  If there are duplicated filename in same fieldName, server can't parse them all.
  ):

```
POST /upload HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="id"
Content-Type: text/plain

123
--abcde12345
Content-Disposition: form-data; name="pictures"; filename="<any-or-no-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .png file…}
--abcde12345
Content-Disposition: form-data; name="pictures"; filename="<any-or-no-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .png file…}
--abcde12345--
```

### Payload_MultiPart_FormData_checkFileNameAndContentType

- Endpoint: `post /multipart/form-data/check-filename-and-content-type`

this case will check filename and content-type of file part, so expect request:

```
POST /upload HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="id"
Content-Type: text/plain

123
--abcde12345
Content-Disposition: form-data; name="profileImage"; filename="hello.jpg"
Content-Type: image/jpg

{…file content of .jpg file…}
--abcde12345--
```

### Payload_MultiPart_FormData_fileArrayAndBasic

- Endpoint: `post /multipart/form-data/complex-parts`

Expect request (

- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.4, content-type of file part shall be labeled with
  appropriate media type, server will check it; content-type of other parts is optional, server will ignore it.
- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.2, filename of file part SHOULD be supplied.
  If there are duplicated filename in same fieldName, server can't parse them all.
  ):

```
POST /upload HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="id"
Content-Type: text/plain

123
--abcde12345
Content-Disposition: form-data; name="address"
Content-Type: application/json

{
  "city": "X"
}
--abcde12345
Content-Disposition: form-data; name="profileImage"; filename="<any-or-no-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .jpg file…}
--abcde12345--
Content-Disposition: form-data; name="previousAddresses"
Content-Type: application/json

[{
  "city": "Y"
},{
  "city": "Z"
}]
--abcde12345
Content-Disposition: form-data; name="pictures"; filename="<any-or-no-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .png file…}
--abcde12345
Content-Disposition: form-data; name="pictures"; filename="<any-or-no-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .png file…}
--abcde12345--
```

### Payload_MultiPart_FormData_HttpParts_ContentType_imageJpegContentType

- Endpoint: `post /multipart/form-data/check-filename-and-specific-content-type-with-httppart`

This case will check filename and specific content-type of file part, so expect request:

```
POST /upload HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="profileImage"; filename="hello.jpg"
Content-Type: image/jpg

{…file content of .jpg file…}
--abcde12345--
```

### Payload_MultiPart_FormData_HttpParts_ContentType_optionalContentType

- Endpoint: `post /multipart/form-data/file-with-http-part-optional-content-type`

Please send request twice, first time with no content-type and second time with content-type "application/octet-stream". Expect request:

```
POST /upload HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="profileImage"; filename="<any-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .jpg file…}
--abcde12345
```

### Payload_MultiPart_FormData_HttpParts_ContentType_requiredContentType

- Endpoint: `post /multipart/form-data/check-filename-and-required-content-type-with-httppart`

This case will check required content-type of file part, so expect request:

```
POST /upload HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="profileImage"; filename="<any-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .jpg file…}
--abcde12345--
```

### Payload_MultiPart_FormData_HttpParts_jsonArrayAndFileArray

- Endpoint: `post /multipart/form-data/complex-parts-with-httppart`

For File part, filename will not be checked but it is necessary otherwise server can't parse it;
content-type will be checked with value "application/octet-stream". Expect request:

```
POST /upload HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="id"
Content-Type: text/plain

123
--abcde12345
Content-Disposition: form-data; name="address"
Content-Type: application/json

{
  "city": "X"
}
--abcde12345
Content-Disposition: form-data; name="profileImage"; filename="<any-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .jpg file…}
--abcde12345--
Content-Disposition: form-data; name="previousAddresses"
Content-Type: application/json

[{
  "city": "Y"
},{
  "city": "Z"
}]
--abcde12345
Content-Disposition: form-data; name="pictures"; filename="<any-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .png file…}
--abcde12345
Content-Disposition: form-data; name="pictures"; filename="<any-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .png file…}
--abcde12345--
```

### Payload_MultiPart_FormData_HttpParts_NonString_float

- Endpoint: `post /multipart/form-data/non-string-float`

Expect request:

```
POST /upload HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="temperature"
Content-Type: text/plain

0.5
--abcde12345
```

### Payload_MultiPart_FormData_jsonPart

- Endpoint: `post /multipart/form-data/json-part`

Expect request (

- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.4, content-type of file part shall be labeled with
  appropriate media type, server will check it; content-type of other parts is optional, server will ignore it.
- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.2, filename of file part SHOULD be supplied.
  If there are duplicated filename in same fieldName, server can't parse them all.
  ):

```
POST /upload HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="address"
Content-Type: application/json

{
  "city": "X"
}
--abcde12345
Content-Disposition: form-data; name="profileImage"; filename="<any-or-no-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .jpg file…}
--abcde12345--
```

### Payload_MultiPart_FormData_multiBinaryParts

- Endpoint: `post /multipart/form-data/multi-binary-parts`

Please send request twice, first time with only profileImage, second time with both profileImage and picture(

- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.4, content-type of file part shall be labeled with
  appropriate media type, server will check it; content-type of other parts is optional, server will ignore it.
- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.2, filename of file part SHOULD be supplied.
  If there are duplicated filename in same fieldName, server can't parse them all.
  ):

```
POST /upload HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="profileImage"; filename="<any-or-no-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .jpg file…}
--abcde12345
Content-Disposition: form-data; name="picture"; filename="<any-or-no-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .png file…}
--abcde12345--
```

### Payload_Pageable_ServerDrivenPagination_ContinuationToken_requestHeaderResponseBody

- Endpoint: `get /payload/pageable/server-driven-pagination/continuationtoken/request-header-response-body`

Test case for using continuation token as pagination. Continuation token is passed in the request header and response body.

Two requests need to be tested.

1. Initial request:
   Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-header-response-body?bar=bar

Expected request header:
foo=foo

Expected response body:

```json
{
  "pets": [
    { "id": "1", "name": "dog" },
    { "id": "2", "name": "cat" }
  ],
  "nextToken": "page2"
}
```

2. Next page request:
   Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-header-response-body?bar=bar

Expected request header:
token=page2
foo=foo

Expected response body:

```json
{
  "pets": [
    { "id": "3", "name": "bird" },
    { "id": "4", "name": "fish" }
  ]
}
```

### Payload_Pageable_ServerDrivenPagination_ContinuationToken_requestHeaderResponseHeader

- Endpoint: `get /payload/pageable/server-driven-pagination/continuationtoken/request-header-response-header`

Test case for using continuation token as pagination. Continuation token is passed in the request header and response header.

Two requests need to be tested.

1. Initial request:
   Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-header-response-header?bar=bar

Expected request header:
foo=foo

Expected response body:

```json
{
  "pets": [
    { "id": "1", "name": "dog" },
    { "id": "2", "name": "cat" }
  ]
}
```

Expected response header:
next-token=page2

2. Next page request:
   Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-header-response-header?bar=bar

Expected request header:
token=page2
foo=foo

Expected response body:

```json
{
  "pets": [
    { "id": "3", "name": "bird" },
    { "id": "4", "name": "fish" }
  ]
}
```

### Payload_Pageable_ServerDrivenPagination_ContinuationToken_requestQueryResponseBody

- Endpoint: `get /payload/pageable/server-driven-pagination/continuationtoken/request-query-response-body`

Test case for using continuation token as pagination. Continuation token is passed in the request query and response body.

Two requests need to be tested.

1. Initial request:
   Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-query-response-body?bar=bar

Expected request header:
foo=foo

Expected response body:

```json
{
  "pets": [
    { "id": "1", "name": "dog" },
    { "id": "2", "name": "cat" }
  ],
  "nextToken": "page2"
}
```

2. Next page request:
   Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-query-response-body?bar=bar&token=page2

Expected request header:
foo=foo

Expected response body:

```json
{
  "pets": [
    { "id": "3", "name": "bird" },
    { "id": "4", "name": "fish" }
  ]
}
```

### Payload_Pageable_ServerDrivenPagination_ContinuationToken_requestQueryResponseHeader

- Endpoint: `get /payload/pageable/server-driven-pagination/continuationtoken/request-query-response-header`

Test case for using continuation token as pagination. Continuation token is passed in the request query and response header.

Two requests need to be tested.

1. Initial request:
   Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-query-response-header?bar=bar

Expected request header:
foo=foo

Expected response body:

```json
{
  "pets": [
    { "id": "1", "name": "dog" },
    { "id": "2", "name": "cat" }
  ]
}
```

Expected response header:
next-token=page2

2. Next page request:
   Expected route: /payload/pageable/server-driven-pagination/continuationtoken/request-query-response-header?bar=bar&token=page2

Expected request header:
foo=foo

Expected response body:

```json
{
  "pets": [
    { "id": "3", "name": "bird" },
    { "id": "4", "name": "fish" }
  ]
}
```

### Payload_Pageable_ServerDrivenPagination_link

- Endpoint: `get /payload/pageable/server-driven-pagination/link`

Test case for using link as pagination.

Two requests need to be tested.

1. Initial request:
   Expected route: /payload/pageable/server-driven-pagination/link
   Expected response body:

```json
{
  "pets": [
    { "id": "1", "name": "dog" },
    { "id": "2", "name": "cat" }
  ],
  "next": "http://[host]:[port]/payload/pageable/server-driven-pagination/link/nextPage"
}
```

2. Next page request:
   Expected route: /payload/pageable/server-driven-pagination/link/nextPage
   Expected response body:

```json
{
  "pets": [
    { "id": "3", "name": "bird" },
    { "id": "4", "name": "fish" }
  ]
}
```

### Payload_Xml_ModelWithArrayOfModelValue_get

- Endpoint: `get /payload/xml/modelWithArrayOfModel`

Expected response body:

```xml
<ModelWithArrayOfModel>
  <items>
    <SimpleModel>
      <name>foo</name>
      <age>123</age>
    </SimpleModel>
    <SimpleModel>
      <name>bar</name>
      <age>456</age>
    </SimpleModel>
  </items>
</ModelWithArrayOfModel>
```

### Payload_Xml_ModelWithArrayOfModelValue_put

- Endpoint: `put /payload/xml/modelWithArrayOfModel`

Expected request body:

```xml
<ModelWithArrayOfModel>
  <items>
    <SimpleModel>
      <name>foo</name>
      <age>123</age>
    </SimpleModel>
    <SimpleModel>
      <name>bar</name>
      <age>456</age>
    </SimpleModel>
  </items>
</ModelWithArrayOfModel>
```

### Payload_Xml_ModelWithAttributesValue_get

- Endpoint: `get /payload/xml/modelWithAttributes`

Expected response body:

```xml
<ModelWithAttributes id1="123" id2="foo">
  <enabled>true</enabled>
</ModelWithAttributes>
```

### Payload_Xml_ModelWithAttributesValue_put

- Endpoint: `put /payload/xml/modelWithAttributes`

Expected request body:

```xml
<ModelWithAttributes id1="123" id2="foo">
  <enabled>true</enabled>
</ModelWithAttributes>
```

### Payload_Xml_ModelWithDictionaryValue_get

- Endpoint: `get /payload/xml/modelWithDictionary`

Expected response body:

```xml
<ModelWithDictionary>
  <metadata>
    <Color>blue</Color>
    <Count>123</Count>
    <Enabled>false</Enabled>
  </metadata>
</ModelWithDictionary>
```

### Payload_Xml_ModelWithDictionaryValue_put

- Endpoint: `put /payload/xml/modelWithDictionary`

Expected request body:

```xml
<ModelWithDictionary>
  <metadata>
    <Color>blue</Color>
    <Count>123</Count>
    <Enabled>false</Enabled>
  </metadata>
</ModelWithDictionary>
```

### Payload_Xml_ModelWithEmptyArrayValue_get

- Endpoint: `get /payload/xml/modelWithEmptyArray`

Expected response body:

```xml
<ModelWithEmptyArray>
  <items />
</ModelWithEmptyArray>
```

### Payload_Xml_ModelWithEmptyArrayValue_put

- Endpoint: `put /payload/xml/modelWithEmptyArray`

Expected request body:

```xml
<ModelWithEmptyArray>
  <items />
</ModelWithEmptyArray>
```

### Payload_Xml_ModelWithEncodedNamesValue_get

- Endpoint: `get /payload/xml/modelWithEncodedNames`

Expected response body:

```xml
<ModelWithEncodedNamesSrc>
  <SimpleModelData>
    <name>foo</name>
    <age>123</age>
  </SimpleModelData>
  <PossibleColors>
    <string>red</string>
    <string>green</string>
    <string>blue</string>
  </PossibleColors>
</ModelWithEncodedNamesSrc>
```

### Payload_Xml_ModelWithEncodedNamesValue_put

- Endpoint: `put /payload/xml/modelWithEncodedNames`

Expected request body:

```xml
<ModelWithEncodedNamesSrc>
  <SimpleModelData>
    <name>foo</name>
    <age>123</age>
  </SimpleModelData>
  <PossibleColors>
    <string>red</string>
    <string>green</string>
    <string>blue</string>
  </PossibleColors>
</ModelWithEncodedNamesSrc>
```

### Payload_Xml_ModelWithOptionalFieldValue_get

- Endpoint: `get /payload/xml/modelWithOptionalField`

Expected response body:

```xml
<ModelWithOptionalField>
  <item>widget</item>
</ModelWithOptionalField>
```

### Payload_Xml_ModelWithOptionalFieldValue_put

- Endpoint: `put /payload/xml/modelWithOptionalField`

Expected request body:

```xml
<ModelWithOptionalField>
  <item>widget</item>
</ModelWithOptionalField>
```

### Payload_Xml_ModelWithRenamedArraysValue_get

- Endpoint: `get /payload/xml/modelWithRenamedArrays`

Expected response body:

```xml
<ModelWithRenamedArrays>
  <Colors>red</Colors>
  <Colors>green</Colors>
  <Colors>blue</Colors>
  <Counts>
    <int32>1</int32>
    <int32>2</int32>
  </Counts>
</ModelWithRenamedArrays>
```

### Payload_Xml_ModelWithRenamedArraysValue_put

- Endpoint: `put /payload/xml/modelWithRenamedArrays`

Expected request body:

```xml
<ModelWithRenamedArrays>
  <Colors>red</Colors>
  <Colors>green</Colors>
  <Colors>blue</Colors>
  <Counts>
    <int32>1</int32>
    <int32>2</int32>
  </Counts>
</ModelWithRenamedArrays>
```

### Payload_Xml_ModelWithRenamedFieldsValue_get

- Endpoint: `get /payload/xml/modelWithRenamedFields`

Expected response body:

```xml
<ModelWithRenamedFieldsSrc>
  <InputData>
    <name>foo</name>
    <age>123</age>
  </InputData>
  <OutputData>
    <name>bar</name>
    <age>456</age>
  </OutputData>
</ModelWithRenamedFieldsSrc>
```

### Payload_Xml_ModelWithRenamedFieldsValue_put

- Endpoint: `put /payload/xml/modelWithRenamedFields`

Expected request body:

```xml
<ModelWithRenamedFieldsSrc>
  <InputData>
    <name>foo</name>
    <age>123</age>
  </InputData>
  <OutputData>
    <name>bar</name>
    <age>456</age>
  </OutputData>
</ModelWithRenamedFieldsSrc>
```

### Payload_Xml_ModelWithSimpleArraysValue_get

- Endpoint: `get /payload/xml/modelWithSimpleArrays`

Expected response body:

```xml
<ModelWithSimpleArrays>
  <colors>
    <string>red</string>
    <string>green</string>
    <string>blue</string>
  </colors>
  <counts>
    <int32>1</int32>
    <int32>2</int32>
  </counts>
</ModelWithSimpleArrays>
```

### Payload_Xml_ModelWithSimpleArraysValue_put

- Endpoint: `put /payload/xml/modelWithSimpleArrays`

Expected request body:

```xml
<ModelWithSimpleArrays>
  <colors>
    <string>red</string>
    <string>green</string>
    <string>blue</string>
  </colors>
  <counts>
    <int32>1</int32>
    <int32>2</int32>
  </counts>
</ModelWithSimpleArrays>
```

### Payload_Xml_ModelWithTextValue_get

- Endpoint: `get /payload/xml/modelWithText`

Expected response body:

```xml
<ModelWithText language="foo">
  This is some text.
</ModelWithText>
```

### Payload_Xml_ModelWithTextValue_put

- Endpoint: `put /payload/xml/modelWithText`

Expected request body:

```xml
<ModelWithText language="foo">
  This is some text.
</ModelWithText>
```

### Payload_Xml_ModelWithUnwrappedArrayValue_get

- Endpoint: `get /payload/xml/modelWithUnwrappedArray`

Expected response body:

```xml
<ModelWithUnwrappedArray>
  <colors>red</colors>
  <colors>green</colors>
  <colors>blue</colors>
  <counts>
    <int32>1</int32>
    <int32>2</int32>
  </counts>
</ModelWithUnwrappedArray>
```

### Payload_Xml_ModelWithUnwrappedArrayValue_put

- Endpoint: `put /payload/xml/modelWithUnwrappedArray`

Expected request body:

```xml
<ModelWithUnwrappedArray>
  <colors>red</colors>
  <colors>green</colors>
  <colors>blue</colors>
  <counts>
    <int32>1</int32>
    <int32>2</int32>
  </counts>
</ModelWithUnwrappedArray>
```

### Payload_Xml_SimpleModelValue_get

- Endpoint: `get /payload/xml/simpleModel`

Expected response body:

```xml
<SimpleModel>
  <name>foo</name>
  <age>123</age>
</SimpleModel>
```

### Payload_Xml_SimpleModelValue_put

- Endpoint: `put /payload/xml/simpleModel`

Expected request body:

```xml
<SimpleModel>
  <name>foo</name>
  <age>123</age>
</SimpleModel>
```

### Response_StatusCodeRange_errorResponseStatusCode404

- Endpoint: `get /response/status-code-range/error-response-status-code-404`

Test case for range of status code in error response.

Verify that the result of the API is an error/exception in client, and the error response can be de-serialized to NotFoundError model (instead of Standard4XXError model).

Expected status code 404 and response body:

```json
{
  "code": "not-found",
  "resourceId": "resource1"
}
```

### Response_StatusCodeRange_errorResponseStatusCodeInRange

- Endpoint: `get /response/status-code-range/error-response-status-code-in-range`

Test case for range of status code in error response.

Verify that the result of the API is an error/exception in client, and the error response can be de-serialized to ErrorInRange model (instead of DefaultError model).

Expected status code 494 and response body:

```json
{
  "code": "request-header-too-large",
  "message": "Request header too large"
}
```

### Routes_fixed

- Endpoint: `get /routes/fixed`

Simple operation at a fixed in an interface
Expected path: /routes/fixed

### Routes_InInterface

- Endpoint: `get /routes/in-interface/fixed`

Simple operation at a fixed in an interface
Expected path: /routes/in-interface/fixed

### Routes_PathParameters_annotationOnly

- Endpoint: `get /routes/path/annotation-only`

Path parameter annotated with @path but not defined explicitly in the route
Value: "a"
Expected path: /routes/path/annotation-only/a

### Routes_PathParameters_explicit

- Endpoint: `get /routes/path/explicit/{param}`

Path parameter defined explicitly
Value: "a"
Expected path: /routes/path/explicit/a

### Routes_PathParameters_LabelExpansion_Explode_array

- Endpoint: `get /routes/path/label/explode/array{.param*}`

Test label expansion with explode: true when passed an array value.
Param value: ["a","b"]
Expected path: /routes/path/label/explode/array.a.b

### Routes_PathParameters_LabelExpansion_Explode_primitive

- Endpoint: `get /routes/path/label/explode/primitive{.param*}`

Test label expansion with explode: true when passed a primitive value.
Param value: "a"
Expected path: /routes/path/label/explode/primitive.a

### Routes_PathParameters_LabelExpansion_Explode_record

- Endpoint: `get /routes/path/label/explode/record{.param*}`

Test label expansion with explode: true when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/path/label/explode/record.a=1.b=2

### Routes_PathParameters_LabelExpansion_Standard_array

- Endpoint: `get /routes/path/label/standard/array{.param}`

Test label expansion with explode: false when passed an array value.
Param value: ["a","b"]
Expected path: /routes/path/label/standard/array.a,b

### Routes_PathParameters_LabelExpansion_Standard_primitive

- Endpoint: `get /routes/path/label/standard/primitive{.param}`

Test label expansion with explode: false when passed a primitive value.
Param value: "a"
Expected path: /routes/path/label/standard/primitive.a

### Routes_PathParameters_LabelExpansion_Standard_record

- Endpoint: `get /routes/path/label/standard/record{.param}`

Test label expansion with explode: false when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/path/label/standard/record.a,1,b,2

### Routes_PathParameters_MatrixExpansion_Explode_array

- Endpoint: `get /routes/path/matrix/explode/array{;param*}`

Test matrix expansion with explode: true when passed an array value.
Param value: ["a","b"]
Expected path: /routes/path/matrix/explode/array;param=a;param=b

### Routes_PathParameters_MatrixExpansion_Explode_primitive

- Endpoint: `get /routes/path/matrix/explode/primitive{;param*}`

Test matrix expansion with explode: true when passed a primitive value.
Param value: "a"
Expected path: /routes/path/matrix/explode/primitive;param=a

### Routes_PathParameters_MatrixExpansion_Explode_record

- Endpoint: `get /routes/path/matrix/explode/record{;param*}`

Test matrix expansion with explode: true when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/path/matrix/explode/record;a=1;b=2

### Routes_PathParameters_MatrixExpansion_Standard_array

- Endpoint: `get /routes/path/matrix/standard/array{;param}`

Test matrix expansion with explode: false when passed an array value.
Param value: ["a","b"]
Expected path: /routes/path/matrix/standard/array;param=a;param=b

### Routes_PathParameters_MatrixExpansion_Standard_primitive

- Endpoint: `get /routes/path/matrix/standard/primitive{;param}`

Test matrix expansion with explode: false when passed a primitive value.
Param value: "a"
Expected path: /routes/path/matrix/standard/primitive;param=a

### Routes_PathParameters_MatrixExpansion_Standard_record

- Endpoint: `get /routes/path/matrix/standard/record{;param}`

Test matrix expansion with explode: false when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/path/matrix/standard/record;a=1;b=2

### Routes_PathParameters_PathExpansion_Explode_array

- Endpoint: `get /routes/path/path/explode/array{/param*}`

Test path expansion with explode: true when passed an array value.
Param value: ["a","b"]
Expected path: /routes/path/path/explode/array/a/b

### Routes_PathParameters_PathExpansion_Explode_primitive

- Endpoint: `get /routes/path/path/explode/primitive{/param*}`

Test path expansion with explode: true when passed a primitive value.
Param value: "a"
Expected path: /routes/path/path/explode/primitive/a

### Routes_PathParameters_PathExpansion_Explode_record

- Endpoint: `get /routes/path/path/explode/record{/param*}`

Test path expansion with explode: true when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/path/path/explode/record/a=1/b=2

### Routes_PathParameters_PathExpansion_Standard_array

- Endpoint: `get /routes/path/path/standard/array{/param}`

Test path expansion with explode: false when passed an array value.
Param value: ["a","b"]
Expected path: /routes/path/path/standard/array/a,b

### Routes_PathParameters_PathExpansion_Standard_primitive

- Endpoint: `get /routes/path/path/standard/primitive{/param}`

Test path expansion with explode: false when passed a primitive value.
Param value: "a"
Expected path: /routes/path/path/standard/primitive/a

### Routes_PathParameters_PathExpansion_Standard_record

- Endpoint: `get /routes/path/path/standard/record{/param}`

Test path expansion with explode: false when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/path/path/standard/record/a,1,b,2

### Routes_PathParameters_ReservedExpansion_annotation

- Endpoint: `get /routes/path/reserved-expansion/annotation`

Defines a path parameter that shouldn't encode reserved characters. It should however still encode the other url characters.
Param value: "foo/bar baz"
Expected path: "/routes/path/reserved-expansion/annotation/foo/bar%20baz"

### Routes_PathParameters_ReservedExpansion_template

- Endpoint: `get /routes/path/reserved-expansion/template/{+param}`

Defines a path parameter that shouldn't encode reserved characters. It should however still encode the other url characters.
Param value: "foo/bar baz"
Expected path: "/routes/path/reserved-expansion/template/foo/bar%20baz"

### Routes_PathParameters_SimpleExpansion_Explode_array

- Endpoint: `get /routes/path/simple/explode/array{param*}`

Test simple expansion with explode: true when passed an array value.
Param value: ["a","b"]
Expected path: /routes/path/simple/explode/arraya.b

### Routes_PathParameters_SimpleExpansion_Explode_primitive

- Endpoint: `get /routes/path/simple/explode/primitive{param*}`

Test simple expansion with explode: true when passed a primitive value.
Param value: "a"
Expected path: /routes/path/simple/explode/primitivea

### Routes_PathParameters_SimpleExpansion_Explode_record

- Endpoint: `get /routes/path/simple/explode/record{param*}`

Test simple expansion with explode: true when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/path/simple/explode/recorda=1,b=2

### Routes_PathParameters_SimpleExpansion_Standard_array

- Endpoint: `get /routes/path/simple/standard/array{param}`

Test simple expansion with explode: false when passed an array value.
Param value: ["a","b"]
Expected path: /routes/path/simple/standard/arraya,b

### Routes_PathParameters_SimpleExpansion_Standard_primitive

- Endpoint: `get /routes/path/simple/standard/primitive{param}`

Test simple expansion with explode: false when passed a primitive value.
Param value: "a"
Expected path: /routes/path/simple/standard/primitivea

### Routes_PathParameters_SimpleExpansion_Standard_record

- Endpoint: `get /routes/path/simple/standard/record{param}`

Test simple expansion with explode: false when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/path/simple/standard/recorda,1,b,2

### Routes_PathParameters_templateOnly

- Endpoint: `get /routes/path/template-only/{param}`

Path parameter defined implicitly
Value: "a"
Expected path: /routes/path/template-only/a

### Routes_QueryParameters_annotationOnly

- Endpoint: `get /routes/query/annotation-only`

Query parameter annotated with @query but not defined explicitly in the route

### Routes_QueryParameters_explicit

- Endpoint: `get /routes/query/explicit{?param}`

Query parameter marked with explicit @query

### Routes_QueryParameters_QueryContinuation_Explode_array

- Endpoint: `get /routes/query/query-continuation/explode/array?fixed=true{&param*}`

Test query continuation expansion with explode: true when passed an array value.
Param value: ["a","b"]
Expected path: /routes/query/query-continuation/explode/array?fixed=true&param=a&param=b

### Routes_QueryParameters_QueryContinuation_Explode_primitive

- Endpoint: `get /routes/query/query-continuation/explode/primitive?fixed=true{&param*}`

Test query continuation expansion with explode: true when passed a primitive value.
Param value: "a"
Expected path: /routes/query/query-continuation/explode/primitive?fixed=true&param=a

### Routes_QueryParameters_QueryContinuation_Explode_record

- Endpoint: `get /routes/query/query-continuation/explode/record?fixed=true{&param*}`

Test query continuation expansion with explode: true when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/query/query-continuation/explode/record?fixed=true&a=1&b=2

### Routes_QueryParameters_QueryContinuation_Standard_array

- Endpoint: `get /routes/query/query-continuation/standard/array?fixed=true{&param}`

Test query continuation expansion with explode: false when passed an array value.
Param value: ["a","b"]
Expected path: /routes/query/query-continuation/standard/array?fixed=true&param=a,b

### Routes_QueryParameters_QueryContinuation_Standard_primitive

- Endpoint: `get /routes/query/query-continuation/standard/primitive?fixed=true{&param}`

Test query continuation expansion with explode: false when passed a primitive value.
Param value: "a"
Expected path: /routes/query/query-continuation/standard/primitive?fixed=true&param=a

### Routes_QueryParameters_QueryContinuation_Standard_record

- Endpoint: `get /routes/query/query-continuation/standard/record?fixed=true{&param}`

Test query continuation expansion with explode: false when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/query/query-continuation/standard/record?fixed=true&param=a,1,b,2

### Routes_QueryParameters_QueryExpansion_Explode_array

- Endpoint: `get /routes/query/query-expansion/explode/array{?param*}`

Test query expansion with explode: true when passed an array value.
Param value: ["a","b"]
Expected path: /routes/query/query-expansion/explode/array?param=a&param=b

### Routes_QueryParameters_QueryExpansion_Explode_primitive

- Endpoint: `get /routes/query/query-expansion/explode/primitive{?param*}`

Test query expansion with explode: true when passed a primitive value.
Param value: "a"
Expected path: /routes/query/query-expansion/explode/primitive?param=a

### Routes_QueryParameters_QueryExpansion_Explode_record

- Endpoint: `get /routes/query/query-expansion/explode/record{?param*}`

Test query expansion with explode: true when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/query/query-expansion/explode/record?a=1&b=2

### Routes_QueryParameters_QueryExpansion_Standard_array

- Endpoint: `get /routes/query/query-expansion/standard/array{?param}`

Test query expansion with explode: false when passed an array value.
Param value: ["a","b"]
Expected path: /routes/query/query-expansion/standard/array?param=a,b

### Routes_QueryParameters_QueryExpansion_Standard_primitive

- Endpoint: `get /routes/query/query-expansion/standard/primitive{?param}`

Test query expansion with explode: false when passed a primitive value.
Param value: "a"
Expected path: /routes/query/query-expansion/standard/primitive?param=a

### Routes_QueryParameters_QueryExpansion_Standard_record

- Endpoint: `get /routes/query/query-expansion/standard/record{?param}`

Test query expansion with explode: false when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/query/query-expansion/standard/record?param=a,1,b,2

### Routes_QueryParameters_templateOnly

- Endpoint: `get /routes/query/template-only{?param}`

Query parameter defined implicitly

### Serialization_EncodedName_Json_Property_get

- Endpoint: `get /serialization/encoded-name/json/property`

Testing that you deserialize the right json name over the wire.

Your generated SDK should generate JsonEncodedNameModel with one property `defaultName` with wire name `wireName`.

Expected response body:

```json
{ "wireName": true }
```

### Serialization_EncodedName_Json_Property_send

- Endpoint: `post /serialization/encoded-name/json/property`

Testing that you send the right JSON name on the wire.
Your generated SDK should generate JsonEncodedNameModel with one property `defaultName` with wire name `wireName`.

Expected request body:

```json
{ "wireName": true }
```

### Server_Endpoint_NotDefined_valid

- Endpoint: `head /server/endpoint/not-defined/valid`

A simple operation in a server without defining a endpoint. Expected uri: '<endpoint you start cadl-ranch>/valid'

### Server_Path_Multiple_noOperationParams

- Endpoint: `get /server/path/multiple/{apiVersion}`

Operation with client path parameters.

Expected path parameter: apiVersion=v1.0

### Server_Path_Multiple_withOperationPathParam

- Endpoint: `get /server/path/multiple/{apiVersion}`

Operation with client and method path parameters.

Expected path parameter: apiVersion=v1.0, keyword=test

### Server_Path_Single_myOp

- Endpoint: `head /server/path/single/myOp`

An simple operation in a parameterized server.

### Server_Versions_NotVersioned_withoutApiVersion

- Endpoint: `head /server/versions/not-versioned/without-api-version`

A simple operation without api-version. Expected url: '/without-api-version', it should not contain any api-version.

### Server_Versions_NotVersioned_withPathApiVersion

- Endpoint: `head /server/versions/not-versioned/with-path-api-version`

A simple operation with path api-version, which doesn't have any default value. Expected url: '/with-path-api-version/v1.0'.

### Server_Versions_NotVersioned_withQueryApiVersion

- Endpoint: `head /server/versions/not-versioned/with-query-api-version`

A simple operation with query api-version, which doesn't have any default value. Expected url: '/with-query-api-version?api-version=v1.0'.

### Server_Versions_Versioned_withoutApiVersion

- Endpoint: `head /server/versions/versioned/without-api-version`

A simple operation without api-version. Expected url: '/without-api-version', it should not contain any api-version.

### Server_Versions_Versioned_withPathApiVersion

- Endpoint: `head /server/versions/versioned/with-path-api-version`

A simple operation with path api-version, whose default value is defined as '2022-12-01-preview'. Expected url: '/with-path-api-version/2022-12-01-preview'.

### Server_Versions_Versioned_withQueryApiVersion

- Endpoint: `head /server/versions/versioned/with-query-api-version`

A simple operation with query api-version, whose default value is defined as '2022-12-01-preview'. Expected url: '/with-query-api-version?api-version=2022-12-01-preview'.

### Server_Versions_Versioned_withQueryOldApiVersion

- Endpoint: `head /server/versions/versioned/with-query-old-api-version`

A simple operation with query api-version, that do NOT use the default but '2021-01-01-preview'. It's expected to be set at the client level. Expected url: '/with-old-query-api-version?api-version=2021-01-01-preview'.

### SpecialHeaders_ConditionalRequest_headIfModifiedSince

- Endpoint: `head /special-headers/conditional-request/if-modified-since`

Check when only If-Modified-Since in header is defined.
Expected header parameters:

- if-modified-since=Fri, 26 Aug 2022 14:38:00 GMT

### SpecialHeaders_ConditionalRequest_postIfMatch

- Endpoint: `post /special-headers/conditional-request/if-match`

Check when only If-Match in header is defined.
Expected header parameters:

- if-match="valid"

### SpecialHeaders_ConditionalRequest_postIfNoneMatch

- Endpoint: `post /special-headers/conditional-request/if-none-match`

Check when only If-None-Match in header is defined.
Expected header parameters:

- if-nonematch="invalid"

### SpecialHeaders_ConditionalRequest_postIfUnmodifiedSince

- Endpoint: `post /special-headers/conditional-request/if-unmodified-since`

Check when only If-Unmodified-Since in header is defined.
Expected header parameters:

- if-unmodified-since=Fri, 26 Aug 2022 14:38:00 GMT

### SpecialHeaders_Repeatability_immediateSuccess

- Endpoint: `post /special-headers/repeatability/immediateSuccess`

Check we recognize Repeatability-Request-ID and Repeatability-First-Sent.

### SpecialWords_ModelProperties_sameAsModel

- Endpoint: `get /special-words/model-properties/same-as-model`

Verify that a property can be called the same as the model name. This can be an issue in some languages where the class name is the constructor.

Send

```json
{ "SameAsModel": "ok" }
```

### SpecialWords_Models_and

- Endpoint: `get /special-words/models/and`

Verify that the name "and" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_as

- Endpoint: `get /special-words/models/as`

Verify that the name "as" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_assert

- Endpoint: `get /special-words/models/assert`

Verify that the name "assert" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_async

- Endpoint: `get /special-words/models/async`

Verify that the name "async" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_await

- Endpoint: `get /special-words/models/await`

Verify that the name "await" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_break

- Endpoint: `get /special-words/models/break`

Verify that the name "break" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_class

- Endpoint: `get /special-words/models/class`

Verify that the name "class" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_constructor

- Endpoint: `get /special-words/models/constructor`

Verify that the name "constructor" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_continue

- Endpoint: `get /special-words/models/continue`

Verify that the name "continue" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_def

- Endpoint: `get /special-words/models/def`

Verify that the name "def" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_del

- Endpoint: `get /special-words/models/del`

Verify that the name "del" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_elif

- Endpoint: `get /special-words/models/elif`

Verify that the name "elif" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_else

- Endpoint: `get /special-words/models/else`

Verify that the name "else" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_except

- Endpoint: `get /special-words/models/except`

Verify that the name "except" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_exec

- Endpoint: `get /special-words/models/exec`

Verify that the name "exec" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_finally

- Endpoint: `get /special-words/models/finally`

Verify that the name "finally" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_for

- Endpoint: `get /special-words/models/for`

Verify that the name "for" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_from

- Endpoint: `get /special-words/models/from`

Verify that the name "from" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_global

- Endpoint: `get /special-words/models/global`

Verify that the name "global" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_if

- Endpoint: `get /special-words/models/if`

Verify that the name "if" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_import

- Endpoint: `get /special-words/models/import`

Verify that the name "import" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_in

- Endpoint: `get /special-words/models/in`

Verify that the name "in" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_is

- Endpoint: `get /special-words/models/is`

Verify that the name "is" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_lambda

- Endpoint: `get /special-words/models/lambda`

Verify that the name "lambda" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_not

- Endpoint: `get /special-words/models/not`

Verify that the name "not" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_or

- Endpoint: `get /special-words/models/or`

Verify that the name "or" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_pass

- Endpoint: `get /special-words/models/pass`

Verify that the name "pass" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_raise

- Endpoint: `get /special-words/models/raise`

Verify that the name "raise" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_return

- Endpoint: `get /special-words/models/return`

Verify that the name "return" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_try

- Endpoint: `get /special-words/models/try`

Verify that the name "try" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_while

- Endpoint: `get /special-words/models/while`

Verify that the name "while" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_with

- Endpoint: `get /special-words/models/with`

Verify that the name "with" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_yield

- Endpoint: `get /special-words/models/yield`

Verify that the name "yield" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Operations_and

- Endpoint: `get /special-words/operations/and`

Verify that the name "and" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_as

- Endpoint: `get /special-words/operations/as`

Verify that the name "as" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_assert

- Endpoint: `get /special-words/operations/assert`

Verify that the name "assert" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_async

- Endpoint: `get /special-words/operations/async`

Verify that the name "async" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_await

- Endpoint: `get /special-words/operations/await`

Verify that the name "await" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_break

- Endpoint: `get /special-words/operations/break`

Verify that the name "break" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_class

- Endpoint: `get /special-words/operations/class`

Verify that the name "class" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_constructor

- Endpoint: `get /special-words/operations/constructor`

Verify that the name "constructor" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_continue

- Endpoint: `get /special-words/operations/continue`

Verify that the name "continue" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_def

- Endpoint: `get /special-words/operations/def`

Verify that the name "def" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_del

- Endpoint: `get /special-words/operations/del`

Verify that the name "del" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_elif

- Endpoint: `get /special-words/operations/elif`

Verify that the name "elif" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_else

- Endpoint: `get /special-words/operations/else`

Verify that the name "else" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_except

- Endpoint: `get /special-words/operations/except`

Verify that the name "except" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_exec

- Endpoint: `get /special-words/operations/exec`

Verify that the name "exec" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_finally

- Endpoint: `get /special-words/operations/finally`

Verify that the name "finally" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_for

- Endpoint: `get /special-words/operations/for`

Verify that the name "for" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_from

- Endpoint: `get /special-words/operations/from`

Verify that the name "from" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_global

- Endpoint: `get /special-words/operations/global`

Verify that the name "global" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_if

- Endpoint: `get /special-words/operations/if`

Verify that the name "if" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_import

- Endpoint: `get /special-words/operations/import`

Verify that the name "import" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_in

- Endpoint: `get /special-words/operations/in`

Verify that the name "in" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_is

- Endpoint: `get /special-words/operations/is`

Verify that the name "is" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_lambda

- Endpoint: `get /special-words/operations/lambda`

Verify that the name "lambda" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_not

- Endpoint: `get /special-words/operations/not`

Verify that the name "not" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_or

- Endpoint: `get /special-words/operations/or`

Verify that the name "or" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_pass

- Endpoint: `get /special-words/operations/pass`

Verify that the name "pass" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_raise

- Endpoint: `get /special-words/operations/raise`

Verify that the name "raise" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_return

- Endpoint: `get /special-words/operations/return`

Verify that the name "return" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_try

- Endpoint: `get /special-words/operations/try`

Verify that the name "try" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_while

- Endpoint: `get /special-words/operations/while`

Verify that the name "while" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_with

- Endpoint: `get /special-words/operations/with`

Verify that the name "with" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_yield

- Endpoint: `get /special-words/operations/yield`

Verify that the name "yield" works as an operation name. Call this operation to pass.

### SpecialWords_Parameters_and

- Endpoint: `get /special-words/parameters/and`

Verify that the name "and" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_as

- Endpoint: `get /special-words/parameters/as`

Verify that the name "as" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_assert

- Endpoint: `get /special-words/parameters/assert`

Verify that the name "assert" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_async

- Endpoint: `get /special-words/parameters/async`

Verify that the name "async" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_await

- Endpoint: `get /special-words/parameters/await`

Verify that the name "await" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_break

- Endpoint: `get /special-words/parameters/break`

Verify that the name "break" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_cancellationToken

- Endpoint: `get /special-words/parameters/cancellationToken`

Verify that the name "cancellationToken" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_class

- Endpoint: `get /special-words/parameters/class`

Verify that the name "class" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_constructor

- Endpoint: `get /special-words/parameters/constructor`

Verify that the name "constructor" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_continue

- Endpoint: `get /special-words/parameters/continue`

Verify that the name "continue" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_def

- Endpoint: `get /special-words/parameters/def`

Verify that the name "def" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_del

- Endpoint: `get /special-words/parameters/del`

Verify that the name "del" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_elif

- Endpoint: `get /special-words/parameters/elif`

Verify that the name "elif" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_else

- Endpoint: `get /special-words/parameters/else`

Verify that the name "else" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_except

- Endpoint: `get /special-words/parameters/except`

Verify that the name "except" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_exec

- Endpoint: `get /special-words/parameters/exec`

Verify that the name "exec" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_finally

- Endpoint: `get /special-words/parameters/finally`

Verify that the name "finally" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_for

- Endpoint: `get /special-words/parameters/for`

Verify that the name "for" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_from

- Endpoint: `get /special-words/parameters/from`

Verify that the name "from" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_global

- Endpoint: `get /special-words/parameters/global`

Verify that the name "global" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_if

- Endpoint: `get /special-words/parameters/if`

Verify that the name "if" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_import

- Endpoint: `get /special-words/parameters/import`

Verify that the name "import" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_in

- Endpoint: `get /special-words/parameters/in`

Verify that the name "in" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_is

- Endpoint: `get /special-words/parameters/is`

Verify that the name "is" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_lambda

- Endpoint: `get /special-words/parameters/lambda`

Verify that the name "lambda" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_not

- Endpoint: `get /special-words/parameters/not`

Verify that the name "not" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_or

- Endpoint: `get /special-words/parameters/or`

Verify that the name "or" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_pass

- Endpoint: `get /special-words/parameters/pass`

Verify that the name "pass" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_raise

- Endpoint: `get /special-words/parameters/raise`

Verify that the name "raise" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_return

- Endpoint: `get /special-words/parameters/return`

Verify that the name "return" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_try

- Endpoint: `get /special-words/parameters/try`

Verify that the name "try" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_while

- Endpoint: `get /special-words/parameters/while`

Verify that the name "while" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_with

- Endpoint: `get /special-words/parameters/with`

Verify that the name "with" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_yield

- Endpoint: `get /special-words/parameters/yield`

Verify that the name "yield" works. Send this parameter to pass with value `ok`.

### Streaming_Jsonl_Basic_receive

- Endpoint: `get /streaming/jsonl/basic/receive`

Basic jsonl streaming for response.

### Streaming_Jsonl_Basic_send

- Endpoint: `post /streaming/jsonl/basic/send`

Basic jsonl streaming for request.

### Type_Array_BooleanValue_get

- Endpoint: `get /type/array/boolean`

Expected Array response body:

```json
[true, false]
```

### Type_Array_BooleanValue_put

- Endpoint: `put /type/array/boolean`

Expected Array input body:

```json
[true, false]
```

### Type_Array_DatetimeValue_get

- Endpoint: `get /type/array/datetime`

Expected Array response body:

```json
["2022-08-26T18:38:00Z"]
```

### Type_Array_DatetimeValue_put

- Endpoint: `put /type/array/datetime`

Expected Array input body:

```json
["2022-08-26T18:38:00Z"]
```

### Type_Array_DurationValue_get

- Endpoint: `get /type/array/duration`

Expected Array response body:

```json
["P123DT22H14M12.011S"]
```

### Type_Array_DurationValue_put

- Endpoint: `put /type/array/duration`

Expected Array input body:

```json
["P123DT22H14M12.011S"]
```

### Type_Array_Float32Value_get

- Endpoint: `get /type/array/float32`

Expected Array response body:

```json
[43.125]
```

### Type_Array_Float32Value_put

- Endpoint: `put /type/array/float32`

Expected Array input body:

```json
[43.125]
```

### Type_Array_Int32Value_get

- Endpoint: `get /type/array/int32`

Expected Array response body:

```json
[1, 2]
```

### Type_Array_Int32Value_put

- Endpoint: `put /type/array/int32`

Expected Array input body:

```json
[1, 2]
```

### Type_Array_Int64Value_get

- Endpoint: `get /type/array/int64`

Expected Array response body:

```json
[0x7fffffffffffffff, -0x7fffffffffffffff]
```

### Type_Array_Int64Value_put

- Endpoint: `put /type/array/int64`

Expected Array input body:

```json
[0x7fffffffffffffff, -0x7fffffffffffffff]
```

### Type_Array_ModelValue_get

- Endpoint: `get /type/array/model`

Expected Array response body:

```json
[{ "property": "hello" }, { "property": "world" }]
```

### Type_Array_ModelValue_put

- Endpoint: `put /type/array/model`

Expected Array input body:

```json
[{ "property": "hello" }, { "property": "world" }]
```

### Type_Array_NullableBooleanValue_get

- Endpoint: `get /type/array/nullable-boolean`

Expected Array response body:

```json
[true, null, false]
```

### Type_Array_NullableBooleanValue_put

- Endpoint: `put /type/array/nullable-boolean`

Expected Array input body:

```json
[true, null, false]
```

### Type_Array_NullableFloatValue_get

- Endpoint: `get /type/array/nullable-float`

Expected Array response body:

```json
[1.25, null, 3.0]
```

### Type_Array_NullableFloatValue_put

- Endpoint: `put /type/array/nullable-float`

Expected Array input body:

```json
[1.25, null, 3.0]
```

### Type_Array_NullableInt32Value_get

- Endpoint: `get /type/array/nullable-int32`

Expected Array response body:

```json
[1, null, 3]
```

### Type_Array_NullableInt32Value_put

- Endpoint: `put /type/array/nullable-int32`

Expected Array input body:

```json
[1, null, 3]
```

### Type_Array_NullableModelValue_get

- Endpoint: `get /type/array/nullable-model`

Expected Array response body:

```json
[{ "property": "hello" }, null, { "property": "world" }]
```

### Type_Array_NullableModelValue_put

- Endpoint: `put /type/array/nullable-model`

Expected Array input body:

```json
[{ "property": "hello" }, null, { "property": "world" }]
```

### Type_Array_NullableStringValue_get

- Endpoint: `get /type/array/nullable-string`

Expected Array response body:

```json
["hello", null, "world"]
```

### Type_Array_NullableStringValue_put

- Endpoint: `put /type/array/nullable-string`

Expected Array input body:

```json
["hello", null, "world"]
```

### Type_Array_StringValue_get

- Endpoint: `get /type/array/string`

Expected Array response body:

```json
["hello", ""]
```

### Type_Array_StringValue_put

- Endpoint: `put /type/array/string`

Expected Array input body:

```json
["hello", ""]
```

### Type_Array_UnknownValue_get

- Endpoint: `get /type/array/unknown`

Expected Array response body:

```json
[1, 'hello', 'k3': null]
```

### Type_Array_UnknownValue_put

- Endpoint: `put /type/array/unknown`

Expected Array input body:

```json
[1, 'hello', 'k3': null]
```

### Type_Dictionary_BooleanValue_get

- Endpoint: `get /type/dictionary/boolean`

Expected dictionary response body:

```json
{ "k1": true, "k2": false }
```

### Type_Dictionary_BooleanValue_put

- Endpoint: `put /type/dictionary/boolean`

Expected dictionary input body:

```json
{ "k1": true, "k2": false }
```

### Type_Dictionary_DatetimeValue_get

- Endpoint: `get /type/dictionary/datetime`

Expected dictionary response body:

```json
{ "k1": "2022-08-26T18:38:00Z" }
```

### Type_Dictionary_DatetimeValue_put

- Endpoint: `put /type/dictionary/datetime`

Expected dictionary input body:

```json
{ "k1": "2022-08-26T18:38:00Z" }
```

### Type_Dictionary_DurationValue_get

- Endpoint: `get /type/dictionary/duration`

Expected dictionary response body:

```json
{ "k1": "P123DT22H14M12.011S" }
```

### Type_Dictionary_DurationValue_put

- Endpoint: `put /type/dictionary/duration`

Expected dictionary input body:

```json
{ "k1": "P123DT22H14M12.011S" }
```

### Type_Dictionary_Float32Value_get

- Endpoint: `get /type/dictionary/float32`

Expected dictionary response body:

```json
{ "k1": 43.125 }
```

### Type_Dictionary_Float32Value_put

- Endpoint: `put /type/dictionary/float32`

Expected dictionary input body:

```json
{ "k1": 43.125 }
```

### Type_Dictionary_Int32Value_get

- Endpoint: `get /type/dictionary/int32`

Expected dictionary response body:

```json
{ "k1": 1, "k2": 2 }
```

### Type_Dictionary_Int32Value_put

- Endpoint: `put /type/dictionary/int32`

Expected dictionary input body:

```json
{ "k1": 1, "k2": 2 }
```

### Type_Dictionary_Int64Value_get

- Endpoint: `get /type/dictionary/int64`

Expected dictionary response body:

```json
{ "k1": 0x7fffffffffffffff, "k2": -0x7fffffffffffffff }
```

### Type_Dictionary_Int64Value_put

- Endpoint: `put /type/dictionary/int64`

Expected dictionary input body:

```json
{ "k1": 0x7fffffffffffffff, "k2": -0x7fffffffffffffff }
```

### Type_Dictionary_ModelValue_get

- Endpoint: `get /type/dictionary/model`

Expected dictionary response body:

```json
{ "k1": { "property": "hello" }, "k2": { "property": "world" } }
```

### Type_Dictionary_ModelValue_put

- Endpoint: `put /type/dictionary/model`

Expected dictionary input body:

```json
{ "k1": { "property": "hello" }, "k2": { "property": "world" } }
```

### Type_Dictionary_NullableFloatValue_get

- Endpoint: `get /type/dictionary/nullable-float`

Expected dictionary response body:

```json
{ "k1": 1.25, "k2": 0.5, "k3": null }
```

### Type_Dictionary_NullableFloatValue_put

- Endpoint: `put /type/dictionary/nullable-float`

Expected dictionary input body:

```json
{ "k1": 1.25, "k2": 0.5, "k3": null }
```

### Type_Dictionary_RecursiveModelValue_get

- Endpoint: `get /type/dictionary/model/recursive`

Expected dictionary response body:

```json
{
  "k1": { "property": "hello", "children": {} },
  "k2": {
    "property": "world",
    "children": { "k2.1": { "property": "inner world" } }
  }
}
```

### Type_Dictionary_RecursiveModelValue_put

- Endpoint: `put /type/dictionary/model/recursive`

Expected dictionary input body:

```json
{
  "k1": { "property": "hello", "children": {} },
  "k2": {
    "property": "world",
    "children": { "k2.1": { "property": "inner world" } }
  }
}
```

### Type_Dictionary_StringValue_get

- Endpoint: `get /type/dictionary/string`

Expected dictionary response body:

```json
{ "k1": "hello", "k2": "" }
```

### Type_Dictionary_StringValue_put

- Endpoint: `put /type/dictionary/string`

Expected dictionary input body:

```json
{ "k1": "hello", "k2": "" }
```

### Type_Dictionary_UnknownValue_get

- Endpoint: `get /type/dictionary/unknown`

Expected dictionary response body:

```json
{ "k1": 1, "k2": "hello", "k3": null }
```

### Type_Dictionary_UnknownValue_put

- Endpoint: `put /type/dictionary/unknown`

Expected dictionary input body:

```json
{ "k1": 1, "k2": "hello", "k3": null }
```

### Type_Enum_Extensible_String_getKnownValue

- Endpoint: `get /type/enum/extensible/string/known-value`

Expect to handle a known value. Mock api will return 'Monday'

### Type_Enum_Extensible_String_getUnknownValue

- Endpoint: `get /type/enum/extensible/string/unknown-value`

Expect to handle an unknown value. Mock api will return 'Weekend'

### Type_Enum_Extensible_String_putKnownValue

- Endpoint: `put /type/enum/extensible/string/known-value`

Expect to send a known value. Mock api expect to receive 'Monday'

### Type_Enum_Extensible_String_putUnknownValue

- Endpoint: `put /type/enum/extensible/string/unknown-value`

Expect to handle an unknown value. Mock api expect to receive 'Weekend'

### Type_Enum_Fixed_String_getKnownValue

- Endpoint: `get /type/enum/fixed/string/known-value`

Expect to handle a known value. Mock api will return 'Monday'

### Type_Enum_Fixed_String_putKnownValue

- Endpoint: `put /type/enum/fixed/string/known-value`

Expect to send a known value. Mock api expect to receive 'Monday'

### Type_Enum_Fixed_String_putUnknownValue

- Endpoint: `put /type/enum/fixed/string/unknown-value`

Expect to handle an unknown value. Mock api expect to receive 'Weekend'

### Type_Model_Empty_getEmpty

- Endpoint: `get /type/model/empty/alone`

Send a GET request which returns the following body {}

### Type_Model_Empty_postRoundTripEmpty

- Endpoint: `post /type/model/empty/round-trip`

Send a POST request with the following body {} which returns the same.

### Type_Model_Empty_putEmpty

- Endpoint: `put /type/model/empty/alone`

Send a PUT request with the following body {}

### Type_Model_Inheritance_EnumDiscriminator_getExtensibleModel

- Endpoint: `get /type/model/inheritance/enum-discriminator/extensible-enum`

Receive model with extensible enum discriminator type.
Expected response body:

```json
{ "kind": "golden", "weight": 10 }
```

### Type_Model_Inheritance_EnumDiscriminator_getExtensibleModelMissingDiscriminator

- Endpoint: `get /type/model/inheritance/enum-discriminator/extensible-enum/missingdiscriminator`

Get a model omitting the discriminator.
Expected response body:

```json
{ "weight": 10 }
```

### Type_Model_Inheritance_EnumDiscriminator_getExtensibleModelWrongDiscriminator

- Endpoint: `get /type/model/inheritance/enum-discriminator/extensible-enum/wrongdiscriminator`

Get a model containing discriminator value never defined.
Expected response body:

```json
{ "weight": 8, "kind": "wrongKind" }
```

### Type_Model_Inheritance_EnumDiscriminator_getFixedModel

- Endpoint: `get /type/model/inheritance/enum-discriminator/fixed-enum`

Receive model with fixed enum discriminator type.
Expected response body:

```json
{ "kind": "cobra", "length": 10 }
```

### Type_Model_Inheritance_EnumDiscriminator_getFixedModelMissingDiscriminator

- Endpoint: `get /type/model/inheritance/enum-discriminator/fixed-enum/missingdiscriminator`

Get a model omitting the discriminator.
Expected response body:

```json
{ "length": 10 }
```

### Type_Model_Inheritance_EnumDiscriminator_getFixedModelWrongDiscriminator

- Endpoint: `get /type/model/inheritance/enum-discriminator/fixed-enum/wrongdiscriminator`

Get a model containing discriminator value never defined.
Expected response body:

```json
{ "length": 8, "kind": "wrongKind" }
```

### Type_Model_Inheritance_EnumDiscriminator_putExtensibleModel

- Endpoint: `put /type/model/inheritance/enum-discriminator/extensible-enum`

Send model with extensible enum discriminator type.
Expected request body:

```json
{ "kind": "golden", "weight": 10 }
```

### Type_Model_Inheritance_EnumDiscriminator_putFixedModel

- Endpoint: `put /type/model/inheritance/enum-discriminator/fixed-enum`

Send model with fixed enum discriminator type.
Expected request body:

```json
{ "kind": "cobra", "length": 10 }
```

### Type_Model_Inheritance_NestedDiscriminator_getMissingDiscriminator

- Endpoint: `get /type/model/inheritance/nested-discriminator/missingdiscriminator`

Get a model omitting the discriminator.
Expected response body:

```json
{ "age": 1 }
```

### Type_Model_Inheritance_NestedDiscriminator_getModel

- Endpoint: `get /type/model/inheritance/nested-discriminator/model`

Generate and receive polymorphic model in multiple levels inheritance with 2 discriminators.
Expected response body:

```json
{ "age": 1, "kind": "shark", "sharktype": "goblin" }
```

### Type_Model_Inheritance_NestedDiscriminator_getRecursiveModel

- Endpoint: `get /type/model/inheritance/nested-discriminator/recursivemodel`

Generate and receive polymorphic models has collection and dictionary properties referring to other polymorphic models.
Expected response body:

```json
{
  "age": 1,
  "kind": "salmon",
  "partner": {
    "age": 2,
    "kind": "shark",
    "sharktype": "saw"
  },
  "friends": [
    {
      "age": 2,
      "kind": "salmon",
      "partner": {
        "age": 3,
        "kind": "salmon"
      },
      "hate": {
        "key1": {
          "age": 4,
          "kind": "salmon"
        },
        "key2": {
          "age": 2,
          "kind": "shark",
          "sharktype": "goblin"
        }
      }
    },
    {
      "age": 3,
      "kind": "shark",
      "sharktype": "goblin"
    }
  ],
  "hate": {
    "key3": {
      "age": 3,
      "kind": "shark",
      "sharktype": "saw"
    },
    "key4": {
      "age": 2,
      "kind": "salmon",
      "friends": [
        {
          "age": 1,
          "kind": "salmon"
        },
        {
          "age": 4,
          "kind": "shark",
          "sharktype": "goblin"
        }
      ]
    }
  }
}
```

### Type_Model_Inheritance_NestedDiscriminator_getWrongDiscriminator

- Endpoint: `get /type/model/inheritance/nested-discriminator/wrongdiscriminator`

Get a model containing discriminator value never defined.
Expected response body:

```json
{ "age": 1, "kind": "wrongKind" }
```

### Type_Model_Inheritance_NestedDiscriminator_putModel

- Endpoint: `put /type/model/inheritance/nested-discriminator/model`

Generate and send polymorphic model in multiple levels inheritance with 2 discriminators.
Expected input body:

```json
{ "age": 1, "kind": "shark", "sharktype": "goblin" }
```

### Type_Model_Inheritance_NestedDiscriminator_putRecursiveModel

- Endpoint: `put /type/model/inheritance/nested-discriminator/recursivemodel`

Generate and send polymorphic models has collection and dictionary properties referring to other polymorphic models.
Expected input body:

```json
{
  "age": 1,
  "kind": "salmon",
  "partner": {
    "age": 2,
    "kind": "shark",
    "sharktype": "saw"
  },
  "friends": [
    {
      "age": 2,
      "kind": "salmon",
      "partner": {
        "age": 3,
        "kind": "salmon"
      },
      "hate": {
        "key1": {
          "age": 4,
          "kind": "salmon"
        },
        "key2": {
          "age": 2,
          "kind": "shark",
          "sharktype": "goblin"
        }
      }
    },
    {
      "age": 3,
      "kind": "shark",
      "sharktype": "goblin"
    }
  ],
  "hate": {
    "key3": {
      "age": 3,
      "kind": "shark",
      "sharktype": "saw"
    },
    "key4": {
      "age": 2,
      "kind": "salmon",
      "friends": [
        {
          "age": 1,
          "kind": "salmon"
        },
        {
          "age": 4,
          "kind": "shark",
          "sharktype": "goblin"
        }
      ]
    }
  }
}
```

### Type_Model_Inheritance_NotDiscriminated_getValid

- Endpoint: `get /type/model/inheritance/not-discriminated/valid`

Generate and receive model.
Expected response body:

```json
{ "name": "abc", "age": 32, "smart": true }
```

### Type_Model_Inheritance_NotDiscriminated_postValid

- Endpoint: `post /type/model/inheritance/not-discriminated/valid`

Generate and send model.
Expected input body:

```json
{ "name": "abc", "age": 32, "smart": true }
```

### Type_Model_Inheritance_NotDiscriminated_putValid

- Endpoint: `put /type/model/inheritance/not-discriminated/valid`

Generate, send, and receive round-trip bottom model.

### Type_Model_Inheritance_Recursive_get

- Endpoint: `get /type/model/inheritance/recursive`

Send a GET request which returns the following body:
Expected response body:

```json
{
  "level": 0,
  "extension": [
    {
      "level": 1,
      "extension": [
        {
          "level": 2
        }
      ]
    },
    {
      "level": 1
    }
  ]
}
```

### Type_Model_Inheritance_Recursive_put

- Endpoint: `put /type/model/inheritance/recursive`

Send a PUT request with the following body:
Expected input body:

```json
{
  "level": 0,
  "extension": [
    {
      "level": 1,
      "extension": [
        {
          "level": 2
        }
      ]
    },
    {
      "level": 1
    }
  ]
}
```

### Type_Model_Inheritance_SingleDiscriminator_getLegacyModel

- Endpoint: `get /type/model/inheritance/single-discriminator/legacy-model`

Generate and receive polymorphic model defined in legacy way.
Expected response body:

```json
{ "size": 20, "kind": "t-rex" }
```

### Type_Model_Inheritance_SingleDiscriminator_getMissingDiscriminator

- Endpoint: `get /type/model/inheritance/single-discriminator/missingdiscriminator`

Get a model omitting the discriminator.
Expected response body:

```json
{ "wingspan": 1 }
```

### Type_Model_Inheritance_SingleDiscriminator_getModel

- Endpoint: `get /type/model/inheritance/single-discriminator/model`

Generate and receive polymorphic model in single level inheritance with 1 discriminator.
Expected response body:

```json
{ "wingspan": 1, "kind": "sparrow" }
```

### Type_Model_Inheritance_SingleDiscriminator_getRecursiveModel

- Endpoint: `get /type/model/inheritance/single-discriminator/recursivemodel`

Generate and receive polymorphic models has collection and dictionary properties referring to other polymorphic models.
Expected response body:

```json
{
  "wingspan": 5,
  "kind": "eagle",
  "partner": {
    "wingspan": 2,
    "kind": "goose"
  },
  "friends": [
    {
      "wingspan": 2,
      "kind": "seagull"
    }
  ],
  "hate": {
    "key3": {
      "wingspan": 1,
      "kind": "sparrow"
    }
  }
}
```

### Type_Model_Inheritance_SingleDiscriminator_getWrongDiscriminator

- Endpoint: `get /type/model/inheritance/single-discriminator/wrongdiscriminator`

Get a model containing discriminator value never defined.
Expected response body:

```json
{ "wingspan": 1, "kind": "wrongKind" }
```

### Type_Model_Inheritance_SingleDiscriminator_putModel

- Endpoint: `put /type/model/inheritance/single-discriminator/model`

Generate and send polymorphic model in single level inheritance with 1 discriminator.
Expected input body:

```json
{ "wingspan": 1, "kind": "sparrow" }
```

### Type_Model_Inheritance_SingleDiscriminator_putRecursiveModel

- Endpoint: `put /type/model/inheritance/single-discriminator/recursivemodel`

Generate and send polymorphic models has collection and dictionary properties referring to other polymorphic models.
Expected input body:

```json
{
  "wingspan": 5,
  "kind": "eagle",
  "partner": {
    "wingspan": 2,
    "kind": "goose"
  },
  "friends": [
    {
      "wingspan": 2,
      "kind": "seagull"
    }
  ],
  "hate": {
    "key3": {
      "wingspan": 1,
      "kind": "sparrow"
    }
  }
}
```

### Type_Model_Usage_input

- Endpoint: `get /type/model/usage/input`

Send a POST request with the following body {requiredProp: "example-value"}

### Type_Model_Usage_inputAndOutput

- Endpoint: `get /type/model/usage/input-output`

Send a POST request which return the following body {requiredProp: "example-value"} and return the same.

### Type_Model_Usage_output

- Endpoint: `get /type/model/usage/output`

Send a GET request which return the following body {requiredProp: "example-value"}

### Type_Model_Visibility_deleteModel

- Endpoint: `delete /type/model/visibility`

Generate abd send put model with write/create properties.
Expected input body:

```json
{
  "deleteProp": true
}
```

### Type_Model_Visibility_getModel

- Endpoint: `get /type/model/visibility`

Generate and receive output model with readonly properties.
Expected no body with `?queryProp=123`.

Expected response body:

```json
{
  "readProp": "abc"
}
```

### Type_Model_Visibility_headModel

- Endpoint: `head /type/model/visibility`

Generate abd send put model with write/create properties.
Expected no body with `?queryProp=123`.

### Type_Model_Visibility_patchModel

- Endpoint: `patch /type/model/visibility`

Generate abd send put model with write/update properties.
Expected input body:

```json
{
  "updateProp": [1, 2]
}
```

### Type_Model_Visibility_postModel

- Endpoint: `post /type/model/visibility`

Generate abd send put model with write/create properties.
Expected input body:

```json
{
  "createProp": ["foo", "bar"]
}
```

### Type_Model_Visibility_putModel

- Endpoint: `put /type/model/visibility`

Generate abd send put model with write/create/update properties.
Expected input body:

```json
{
  "createProp": ["foo", "bar"],
  "updateProp": [1, 2]
}
```

### Type_Model_Visibility_putReadOnlyModel

- Endpoint: `put /type/model/visibility/readonlyroundtrip`

Generate and receive output model with readonly properties.

Expected input body:

```json
{}
```

Expected response body:

```json
{
  "optionalNullableIntList": [1, 2, 3],
  "optionalStringRecord": { "k1": "value1", "k2": "value2" }
}
```

### Type_Property_AdditionalProperties_ExtendsDifferentSpreadFloat_get

- Endpoint: `get /type/property/additionalProperties/extendsDifferentSpreadFloat`

Expected response body:

```json
{ "name": "abc", "prop": 43.125, "derivedProp": 43.125 }
```

### Type_Property_AdditionalProperties_ExtendsDifferentSpreadFloat_put

- Endpoint: `put /type/property/additionalProperties/extendsDifferentSpreadFloat`

Expected input body:

```json
{ "name": "abc", "prop": 43.125, "derivedProp": 43.125 }
```

### Type_Property_AdditionalProperties_ExtendsDifferentSpreadModel_get

- Endpoint: `get /type/property/additionalProperties/extendsDifferentSpreadModel`

Expected response body:

```json
{
  "knownProp": "abc",
  "prop": { "state": "ok" },
  "derivedProp": { "state": "ok" }
}
```

### Type_Property_AdditionalProperties_ExtendsDifferentSpreadModel_put

- Endpoint: `put /type/property/additionalProperties/extendsDifferentSpreadModel`

Expected input body:

```json
{
  "knownProp": "abc",
  "prop": { "state": "ok" },
  "derivedProp": { "state": "ok" }
}
```

### Type_Property_AdditionalProperties_ExtendsDifferentSpreadModelArray_get

- Endpoint: `get /type/property/additionalProperties/extendsDifferentSpreadModelArray`

Expected response body:

```json
{
  "knownProp": "abc",
  "prop": [{ "state": "ok" }, { "state": "ok" }],
  "derivedProp": [{ "state": "ok" }, { "state": "ok" }]
}
```

### Type_Property_AdditionalProperties_ExtendsDifferentSpreadModelArray_put

- Endpoint: `put /type/property/additionalProperties/extendsDifferentSpreadModelArray`

Expected input body:

```json
{
  "knownProp": "abc",
  "prop": [{ "state": "ok" }, { "state": "ok" }],
  "derivedProp": [{ "state": "ok" }, { "state": "ok" }]
}
```

### Type_Property_AdditionalProperties_ExtendsDifferentSpreadString_get

- Endpoint: `get /type/property/additionalProperties/extendsDifferentSpreadString`

Expected response body:

```json
{ "id": 43.125, "prop": "abc", "derivedProp": "abc" }
```

### Type_Property_AdditionalProperties_ExtendsDifferentSpreadString_put

- Endpoint: `put /type/property/additionalProperties/extendsDifferentSpreadString`

Expected input body:

```json
{ "id": 43.125, "prop": "abc", "derivedProp": "abc" }
```

### Type_Property_AdditionalProperties_ExtendsFloat_get

- Endpoint: `get /type/property/additionalProperties/extendsRecordFloat`

Expected response body:

```json
{ "id": 43.125, "prop": 43.125 }
```

### Type_Property_AdditionalProperties_ExtendsFloat_put

- Endpoint: `put /type/property/additionalProperties/extendsRecordFloat`

Expected input body:

```json
{ "id": 43.125, "prop": 43.125 }
```

### Type_Property_AdditionalProperties_ExtendsModel_get

- Endpoint: `get /type/property/additionalProperties/extendsRecordModel`

Expected response body:

```json
{ "knownProp": { "state": "ok" }, "prop": { "state": "ok" } }
```

### Type_Property_AdditionalProperties_ExtendsModel_put

- Endpoint: `put /type/property/additionalProperties/extendsRecordModel`

Expected input body:

```json
{ "knownProp": { "state": "ok" }, "prop": { "state": "ok" } }
```

### Type_Property_AdditionalProperties_ExtendsModelArray_get

- Endpoint: `get /type/property/additionalProperties/extendsRecordModelArray`

Expected response body:

```json
{
  "knownProp": [{ "state": "ok" }, { "state": "ok" }],
  "prop": [{ "state": "ok" }, { "state": "ok" }]
}
```

### Type_Property_AdditionalProperties_ExtendsModelArray_put

- Endpoint: `put /type/property/additionalProperties/extendsRecordModelArray`

Expected input body:

```json
{
  "knownProp": [{ "state": "ok" }, { "state": "ok" }],
  "prop": [{ "state": "ok" }, { "state": "ok" }]
}
```

### Type_Property_AdditionalProperties_ExtendsString_get

- Endpoint: `get /type/property/additionalProperties/extendsRecordString`

Expected response body:

```json
{ "name": "ExtendsStringAdditionalProperties", "prop": "abc" }
```

### Type_Property_AdditionalProperties_ExtendsString_put

- Endpoint: `put /type/property/additionalProperties/extendsRecordString`

Expected input body:

```json
{ "name": "ExtendsStringAdditionalProperties", "prop": "abc" }
```

### Type_Property_AdditionalProperties_ExtendsUnknown_get

- Endpoint: `get /type/property/additionalProperties/extendsRecordUnknown`

Expected response body:

```json
{
  "name": "ExtendsUnknownAdditionalProperties",
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_ExtendsUnknown_put

- Endpoint: `put /type/property/additionalProperties/extendsRecordUnknown`

Expected input body:

```json
{
  "name": "ExtendsUnknownAdditionalProperties",
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_ExtendsUnknownDerived_get

- Endpoint: `get /type/property/additionalProperties/extendsRecordUnknownDerived`

Expected response body:

```json
{
  "name": "ExtendsUnknownAdditionalProperties",
  "index": 314,
  "age": 2.71875,
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_ExtendsUnknownDerived_put

- Endpoint: `put /type/property/additionalProperties/extendsRecordUnknownDerived`

Expected input body:

```json
{
  "name": "ExtendsUnknownAdditionalProperties",
  "index": 314,
  "age": 2.71875,
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_ExtendsUnknownDiscriminated_get

- Endpoint: `get /type/property/additionalProperties/extendsUnknownDiscriminated`

Expected response body:

```json
{
  "kind": "derived",
  "name": "Derived",
  "index": 314,
  "age": 2.71875,
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_ExtendsUnknownDiscriminated_put

- Endpoint: `put /type/property/additionalProperties/extendsUnknownDiscriminated`

Expected input body:

```json
{
  "kind": "derived",
  "name": "Derived",
  "index": 314,
  "age": 2.71875,
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_IsFloat_get

- Endpoint: `get /type/property/additionalProperties/isRecordFloat`

Expected response body:

```json
{ "id": 43.125, "prop": 43.125 }
```

### Type_Property_AdditionalProperties_IsFloat_put

- Endpoint: `put /type/property/additionalProperties/isRecordFloat`

Expected input body:

```json
{ "id": 43.125, "prop": 43.125 }
```

### Type_Property_AdditionalProperties_IsModel_get

- Endpoint: `get /type/property/additionalProperties/isRecordModel`

Expected response body:

```json
{ "knownProp": { "state": "ok" }, "prop": { "state": "ok" } }
```

### Type_Property_AdditionalProperties_IsModel_put

- Endpoint: `put /type/property/additionalProperties/isRecordModel`

Expected input body:

```json
{ "knownProp": { "state": "ok" }, "prop": { "state": "ok" } }
```

### Type_Property_AdditionalProperties_IsModelArray_get

- Endpoint: `get /type/property/additionalProperties/isRecordModelArray`

Expected response body:

```json
{
  "knownProp": [{ "state": "ok" }, { "state": "ok" }],
  "prop": [{ "state": "ok" }, { "state": "ok" }]
}
```

### Type_Property_AdditionalProperties_IsModelArray_put

- Endpoint: `put /type/property/additionalProperties/isRecordModelArray`

Expected input body:

```json
{
  "knownProp": [{ "state": "ok" }, { "state": "ok" }],
  "prop": [{ "state": "ok" }, { "state": "ok" }]
}
```

### Type_Property_AdditionalProperties_IsString_get

- Endpoint: `get /type/property/additionalProperties/isRecordstring`

Expected response body:

```json
{ "name": "IsStringAdditionalProperties", "prop": "abc" }
```

### Type_Property_AdditionalProperties_IsString_put

- Endpoint: `put /type/property/additionalProperties/isRecordstring`

Expected input body:

```json
{ "name": "IsStringAdditionalProperties", "prop": "abc" }
```

### Type_Property_AdditionalProperties_IsUnknown_get

- Endpoint: `get /type/property/additionalProperties/isRecordUnknown`

Expected response body:

```json
{
  "name": "IsUnknownAdditionalProperties",
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_IsUnknown_put

- Endpoint: `put /type/property/additionalProperties/isRecordUnknown`

Expected input body:

```json
{
  "name": "IsUnknownAdditionalProperties",
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_IsUnknownDerived_get

- Endpoint: `get /type/property/additionalProperties/isRecordUnknownDerived`

Expected response body:

```json
{
  "name": "IsUnknownAdditionalProperties",
  "index": 314,
  "age": 2.71875,
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_IsUnknownDerived_put

- Endpoint: `put /type/property/additionalProperties/isRecordUnknownDerived`

Expected input body:

```json
{
  "name": "IsUnknownAdditionalProperties",
  "index": 314,
  "age": 2.71875,
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_IsUnknownDiscriminated_get

- Endpoint: `get /type/property/additionalProperties/isUnknownDiscriminated`

Expected response body:

```json
{
  "kind": "derived",
  "name": "Derived",
  "index": 314,
  "age": 2.71875,
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_IsUnknownDiscriminated_put

- Endpoint: `put /type/property/additionalProperties/isUnknownDiscriminated`

Expected input body:

```json
{
  "kind": "derived",
  "name": "Derived",
  "index": 314,
  "age": 2.71875,
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_MultipleSpread_get

- Endpoint: `get /type/property/additionalProperties/multipleSpreadRecord`

Expected response body:

```json
{ "flag": true, "prop1": "abc", "prop2": 43.125 }
```

### Type_Property_AdditionalProperties_MultipleSpread_put

- Endpoint: `put /type/property/additionalProperties/multipleSpreadRecord`

Expected input body:

```json
{ "flag": true, "prop1": "abc", "prop2": 43.125 }
```

### Type_Property_AdditionalProperties_SpreadDifferentFloat_get

- Endpoint: `get /type/property/additionalProperties/spreadDifferentRecordFloat`

Expected response body:

```json
{ "name": "abc", "prop": 43.125 }
```

### Type_Property_AdditionalProperties_SpreadDifferentFloat_put

- Endpoint: `put /type/property/additionalProperties/spreadDifferentRecordFloat`

Expected input body:

```json
{ "name": "abc", "prop": 43.125 }
```

### Type_Property_AdditionalProperties_SpreadDifferentModel_get

- Endpoint: `get /type/property/additionalProperties/spreadDifferentRecordModel`

Expected response body:

```json
{ "knownProp": "abc", "prop": { "state": "ok" } }
```

### Type_Property_AdditionalProperties_SpreadDifferentModel_put

- Endpoint: `put /type/property/additionalProperties/spreadDifferentRecordModel`

Expected input body:

```json
{ "knownProp": "abc", "prop": { "state": "ok" } }
```

### Type_Property_AdditionalProperties_SpreadDifferentModelArray_get

- Endpoint: `get /type/property/additionalProperties/spreadDifferentRecordModelArray`

Expected response body:

```json
{ "knownProp": "abc", "prop": [{ "state": "ok" }, { "state": "ok" }] }
```

### Type_Property_AdditionalProperties_SpreadDifferentModelArray_put

- Endpoint: `put /type/property/additionalProperties/spreadDifferentRecordModelArray`

Expected input body:

```json
{ "knownProp": "abc", "prop": [{ "state": "ok" }, { "state": "ok" }] }
```

### Type_Property_AdditionalProperties_SpreadDifferentString_get

- Endpoint: `get /type/property/additionalProperties/spreadDifferentRecordString`

Expected response body:

```json
{ "id": 43.125, "prop": "abc" }
```

### Type_Property_AdditionalProperties_SpreadDifferentString_put

- Endpoint: `put /type/property/additionalProperties/spreadDifferentRecordString`

Expected input body:

```json
{ "id": 43.125, "prop": "abc" }
```

### Type_Property_AdditionalProperties_SpreadFloat_get

- Endpoint: `get /type/property/additionalProperties/spreadRecordFloat`

Expected response body:

```json
{ "id": 43.125, "prop": 43.125 }
```

### Type_Property_AdditionalProperties_SpreadFloat_put

- Endpoint: `put /type/property/additionalProperties/spreadRecordFloat`

Expected input body:

```json
{ "id": 43.125, "prop": 43.125 }
```

### Type_Property_AdditionalProperties_SpreadModel_get

- Endpoint: `get /type/property/additionalProperties/spreadRecordModel`

Expected response body:

```json
{ "knownProp": { "state": "ok" }, "prop": { "state": "ok" } }
```

### Type_Property_AdditionalProperties_SpreadModel_put

- Endpoint: `put /type/property/additionalProperties/spreadRecordModel`

Expected input body:

```json
{ "knownProp": { "state": "ok" }, "prop": { "state": "ok" } }
```

### Type_Property_AdditionalProperties_SpreadModelArray_get

- Endpoint: `get /type/property/additionalProperties/spreadRecordModelArray`

Expected response body:

```json
{
  "knownProp": [{ "state": "ok" }, { "state": "ok" }],
  "prop": [{ "state": "ok" }, { "state": "ok" }]
}
```

### Type_Property_AdditionalProperties_SpreadModelArray_put

- Endpoint: `put /type/property/additionalProperties/spreadRecordModelArray`

Expected input body:

```json
{
  "knownProp": [{ "state": "ok" }, { "state": "ok" }],
  "prop": [{ "state": "ok" }, { "state": "ok" }]
}
```

### Type_Property_AdditionalProperties_SpreadRecordNonDiscriminatedUnion_get

- Endpoint: `get /type/property/additionalProperties/spreadRecordNonDiscriminatedUnion`

Expected response body:

```json
{
  "name": "abc",
  "prop1": { "kind": "kind0", "fooProp": "abc" },
  "prop2": {
    "kind": "kind1",
    "start": "2021-01-01T00:00:00Z",
    "end": "2021-01-02T00:00:00Z"
  }
}
```

### Type_Property_AdditionalProperties_SpreadRecordNonDiscriminatedUnion_put

- Endpoint: `put /type/property/additionalProperties/spreadRecordNonDiscriminatedUnion`

Expected input body:

```json
{
  "name": "abc",
  "prop1": { "kind": "kind0", "fooProp": "abc" },
  "prop2": {
    "kind": "kind1",
    "start": "2021-01-01T00:00:00Z",
    "end": "2021-01-02T00:00:00Z"
  }
}
```

### Type_Property_AdditionalProperties_SpreadRecordNonDiscriminatedUnion2_get

- Endpoint: `get /type/property/additionalProperties/spreadRecordNonDiscriminatedUnion2`

Expected response body:

```json
{
  "name": "abc",
  "prop1": { "kind": "kind1", "start": "2021-01-01T00:00:00Z" },
  "prop2": {
    "kind": "kind1",
    "start": "2021-01-01T00:00:00Z",
    "end": "2021-01-02T00:00:00Z"
  }
}
```

### Type_Property_AdditionalProperties_SpreadRecordNonDiscriminatedUnion2_put

- Endpoint: `put /type/property/additionalProperties/spreadRecordNonDiscriminatedUnion2`

Expected input body:

```json
{
  "name": "abc",
  "prop1": { "kind": "kind1", "start": "2021-01-01T00:00:00Z" },
  "prop2": {
    "kind": "kind1",
    "start": "2021-01-01T00:00:00Z",
    "end": "2021-01-02T00:00:00Z"
  }
}
```

### Type_Property_AdditionalProperties_SpreadRecordNonDiscriminatedUnion3_get

- Endpoint: `get /type/property/additionalProperties/spreadRecordNonDiscriminatedUnion3`

Expected response body:

```json
{'name': 'abc', 'prop1': [{'kind': 'kind1', 'start': '2021-01-01T00:00:00Z'}, {'kind': 'kind1', 'start': '2021-01-01T00:00:00Z'], 'prop2': {'kind': 'kind1', 'start': '2021-01-01T00:00:00Z', 'end': '2021-01-02T00:00:00Z'}}
```

### Type_Property_AdditionalProperties_SpreadRecordNonDiscriminatedUnion3_put

- Endpoint: `put /type/property/additionalProperties/spreadRecordNonDiscriminatedUnion3`

Expected input body:

```json
{'name': 'abc', 'prop1': [{'kind': 'kind1', 'start': '2021-01-01T00:00:00Z'}, {'kind': 'kind1', 'start': '2021-01-01T00:00:00Z'], 'prop2': {'kind': 'kind1', 'start': '2021-01-01T00:00:00Z', 'end': '2021-01-02T00:00:00Z'}}
```

### Type_Property_AdditionalProperties_SpreadRecordUnion_get

- Endpoint: `get /type/property/additionalProperties/spreadRecordUnion`

Expected response body:

```json
{ "flag": true, "prop1": "abc", "prop2": 43.125 }
```

### Type_Property_AdditionalProperties_SpreadRecordUnion_put

- Endpoint: `put /type/property/additionalProperties/spreadRecordUnion`

Expected input body:

```json
{ "flag": true, "prop1": "abc", "prop2": 43.125 }
```

### Type_Property_AdditionalProperties_SpreadString_get

- Endpoint: `get /type/property/additionalProperties/spreadRecordString`

Expected response body:

```json
{ "name": "SpreadSpringRecord", "prop": "abc" }
```

### Type_Property_AdditionalProperties_SpreadString_put

- Endpoint: `put /type/property/additionalProperties/spreadRecordString`

Expected input body:

```json
{ "name": "SpreadSpringRecord", "prop": "abc" }
```

### Type_Property_Nullable_Bytes_getNonNull

- Endpoint: `get /type/property/nullable/bytes/non-null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": aGVsbG8sIHdvcmxkIQ==}
```

### Type_Property_Nullable_Bytes_getNull

- Endpoint: `get /type/property/nullable/bytes/null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_Bytes_patchNonNull

- Endpoint: `patch /type/property/nullable/bytes/non-null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": aGVsbG8sIHdvcmxkIQ==}
```

### Type_Property_Nullable_Bytes_patchNull

- Endpoint: `patch /type/property/nullable/bytes/null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_CollectionsByte_getNonNull

- Endpoint: `get /type/property/nullable/collections/bytes/non-null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": [aGVsbG8sIHdvcmxkIQ==, aGVsbG8sIHdvcmxkIQ==]}
```

### Type_Property_Nullable_CollectionsByte_getNull

- Endpoint: `get /type/property/nullable/collections/bytes/null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_CollectionsByte_patchNonNull

- Endpoint: `patch /type/property/nullable/collections/bytes/non-null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": [aGVsbG8sIHdvcmxkIQ==, aGVsbG8sIHdvcmxkIQ==]}
```

### Type_Property_Nullable_CollectionsByte_patchNull

- Endpoint: `patch /type/property/nullable/collections/bytes/null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_CollectionsModel_getNonNull

- Endpoint: `get /type/property/nullable/collections/model/non-null`

Expected response body:

```json
{
  "requiredProperty": "foo",
  "nullableProperty": [{ "property": "hello" }, { "property": "world" }]
}
```

### Type_Property_Nullable_CollectionsModel_getNull

- Endpoint: `get /type/property/nullable/collections/model/null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_CollectionsModel_patchNonNull

- Endpoint: `patch /type/property/nullable/collections/model/non-null`

Expected request body:

```json
{
  "requiredProperty": "foo",
  "nullableProperty": [{ "property": "hello" }, { "property": "world" }]
}
```

### Type_Property_Nullable_CollectionsModel_patchNull

- Endpoint: `patch /type/property/nullable/collections/model/null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_CollectionsString_getNonNull

- Endpoint: `get /type/property/nullable/collections/string/non-null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": ["hello", "world"] }
```

### Type_Property_Nullable_CollectionsString_getNull

- Endpoint: `get /type/property/nullable/collections/string/null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_CollectionsString_patchNonNull

- Endpoint: `patch /type/property/nullable/collections/string/non-null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": ["hello", "world"] }
```

### Type_Property_Nullable_CollectionsString_patchNull

- Endpoint: `patch /type/property/nullable/collections/string/null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_Datetime_getNonNull

- Endpoint: `get /type/property/nullable/datetime/non-null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": 2022-08-26T18:38:00Z}
```

### Type_Property_Nullable_Datetime_getNull

- Endpoint: `get /type/property/nullable/datetime/null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_Datetime_patchNonNull

- Endpoint: `patch /type/property/nullable/datetime/non-null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": 2022-08-26T18:38:00Z}
```

### Type_Property_Nullable_Datetime_patchNull

- Endpoint: `patch /type/property/nullable/datetime/null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_Duration_getNonNull

- Endpoint: `get /type/property/nullable/duration/non-null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": P123DT22H14M12.011S}
```

### Type_Property_Nullable_Duration_getNull

- Endpoint: `get /type/property/nullable/duration/null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_Duration_patchNonNull

- Endpoint: `patch /type/property/nullable/duration/non-null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": P123DT22H14M12.011S}
```

### Type_Property_Nullable_Duration_patchNull

- Endpoint: `patch /type/property/nullable/duration/null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_String_getNonNull

- Endpoint: `get /type/property/nullable/string/non-null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": hello}
```

### Type_Property_Nullable_String_getNull

- Endpoint: `get /type/property/nullable/string/null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_String_patchNonNull

- Endpoint: `patch /type/property/nullable/string/non-null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": hello}
```

### Type_Property_Nullable_String_patchNull

- Endpoint: `patch /type/property/nullable/string/null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Optional_BooleanLiteral_getAll

- Endpoint: `get /type/property/optional/boolean/literal/all`

Expected response body:

```json
{ "property": true }
```

### Type_Property_Optional_BooleanLiteral_getDefault

- Endpoint: `get /type/property/optional/boolean/literal/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_BooleanLiteral_putAll

- Endpoint: `put /type/property/optional/boolean/literal/all`

Expected request body:

```json
{ "property": true }
```

### Type_Property_Optional_BooleanLiteral_putDefault

- Endpoint: `put /type/property/optional/boolean/literal/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_Bytes_getAll

- Endpoint: `get /type/property/optional/bytes/all`

Expected response body:

```json
{ "property": "aGVsbG8sIHdvcmxkIQ==" }
```

### Type_Property_Optional_Bytes_getDefault

- Endpoint: `get /type/property/optional/bytes/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_Bytes_putAll

- Endpoint: `put /type/property/optional/bytes/all`

Expected request body:

```json
{ "property": "aGVsbG8sIHdvcmxkIQ==" }
```

### Type_Property_Optional_Bytes_putDefault

- Endpoint: `put /type/property/optional/bytes/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_CollectionsByte_getAll

- Endpoint: `get /type/property/optional/collections/bytes/all`

Expected response body:

```json
{ "property": ["aGVsbG8sIHdvcmxkIQ==", "aGVsbG8sIHdvcmxkIQ=="] }
```

### Type_Property_Optional_CollectionsByte_getDefault

- Endpoint: `get /type/property/optional/collections/bytes/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_CollectionsByte_putAll

- Endpoint: `put /type/property/optional/collections/bytes/all`

Expected request body:

```json
{ "property": ["aGVsbG8sIHdvcmxkIQ==", "aGVsbG8sIHdvcmxkIQ=="] }
```

### Type_Property_Optional_CollectionsByte_putDefault

- Endpoint: `put /type/property/optional/collections/bytes/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_CollectionsModel_getAll

- Endpoint: `get /type/property/optional/collections/model/all`

Expected response body:

```json
{ "property": [{ "property": "hello" }, { "property": "world" }] }
```

### Type_Property_Optional_CollectionsModel_getDefault

- Endpoint: `get /type/property/optional/collections/model/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_CollectionsModel_putAll

- Endpoint: `put /type/property/optional/collections/model/all`

Expected request body:

```json
{ "property": [{ "property": "hello" }, { "property": "world" }] }
```

### Type_Property_Optional_CollectionsModel_putDefault

- Endpoint: `put /type/property/optional/collections/model/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_Datetime_getAll

- Endpoint: `get /type/property/optional/datetime/all`

Expected response body:

```json
{ "property": "2022-08-26T18:38:00Z" }
```

### Type_Property_Optional_Datetime_getDefault

- Endpoint: `get /type/property/optional/datetime/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_Datetime_putAll

- Endpoint: `put /type/property/optional/datetime/all`

Expected request body:

```json
{ "property": "2022-08-26T18:38:00Z" }
```

### Type_Property_Optional_Datetime_putDefault

- Endpoint: `put /type/property/optional/datetime/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_Duration_getAll

- Endpoint: `get /type/property/optional/duration/all`

Expected response body:

```json
{ "property": "P123DT22H14M12.011S" }
```

### Type_Property_Optional_Duration_getDefault

- Endpoint: `get /type/property/optional/duration/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_Duration_putAll

- Endpoint: `put /type/property/optional/duration/all`

Expected request body:

```json
{ "property": "P123DT22H14M12.011S" }
```

### Type_Property_Optional_Duration_putDefault

- Endpoint: `put /type/property/optional/duration/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_FloatLiteral_getAll

- Endpoint: `get /type/property/optional/float/literal/all`

Expected response body:

```json
{ "property": 1.25 }
```

### Type_Property_Optional_FloatLiteral_getDefault

- Endpoint: `get /type/property/optional/float/literal/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_FloatLiteral_putAll

- Endpoint: `put /type/property/optional/float/literal/all`

Expected request body:

```json
{ "property": 1.25 }
```

### Type_Property_Optional_FloatLiteral_putDefault

- Endpoint: `put /type/property/optional/float/literal/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_IntLiteral_getAll

- Endpoint: `get /type/property/optional/int/literal/all`

Expected response body:

```json
{ "property": 1 }
```

### Type_Property_Optional_IntLiteral_getDefault

- Endpoint: `get /type/property/optional/int/literal/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_IntLiteral_putAll

- Endpoint: `put /type/property/optional/int/literal/all`

Expected request body:

```json
{ "property": 1 }
```

### Type_Property_Optional_IntLiteral_putDefault

- Endpoint: `put /type/property/optional/int/literal/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_PlainDate_getAll

- Endpoint: `get /type/property/optional/plainDate/all`

Expected response body:

```json
{ "property": "2022-12-12" }
```

### Type_Property_Optional_PlainDate_getDefault

- Endpoint: `get /type/property/optional/plainDate/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_PlainDate_putAll

- Endpoint: `put /type/property/optional/plainDate/all`

Expected request body:

```json
{ "property": "2022-12-12" }
```

### Type_Property_Optional_PlainDate_putDefault

- Endpoint: `put /type/property/optional/plainDate/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_PlainTime_getAll

- Endpoint: `get /type/property/optional/plainTime/all`

Expected response body:

```json
{ "property": "13:06:12" }
```

### Type_Property_Optional_PlainTime_getDefault

- Endpoint: `get /type/property/optional/plainTime/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_PlainTime_putAll

- Endpoint: `put /type/property/optional/plainTime/all`

Expected request body:

```json
{ "property": "13:06:12" }
```

### Type_Property_Optional_PlainTime_putDefault

- Endpoint: `put /type/property/optional/plainTime/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_RequiredAndOptional_getAll

- Endpoint: `get /type/property/optional/requiredAndOptional/all`

Expected response body:

```json
{ "optionalProperty": "hello", "requiredProperty": 42 }
```

### Type_Property_Optional_RequiredAndOptional_getRequiredOnly

- Endpoint: `get /type/property/optional/requiredAndOptional/requiredOnly`

Expected response body:

```json
{ "requiredProperty": 42 }
```

### Type_Property_Optional_RequiredAndOptional_putAll

- Endpoint: `put /type/property/optional/requiredAndOptional/all`

Expected request body:

```json
{ "optionalProperty": "hello", "requiredProperty": 42 }
```

### Type_Property_Optional_RequiredAndOptional_putRequiredOnly

- Endpoint: `put /type/property/optional/requiredAndOptional/requiredOnly`

Expected request body:

```json
{ "requiredProperty": 42 }
```

### Type_Property_Optional_String_getAll

- Endpoint: `get /type/property/optional/string/all`

Expected response body:

```json
{ "property": "hello" }
```

### Type_Property_Optional_String_getDefault

- Endpoint: `get /type/property/optional/string/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_String_putAll

- Endpoint: `put /type/property/optional/string/all`

Expected request body:

```json
{ "property": "hello" }
```

### Type_Property_Optional_String_putDefault

- Endpoint: `put /type/property/optional/string/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_StringLiteral_getAll

- Endpoint: `get /type/property/optional/string/literal/all`

Expected response body:

```json
{ "property": "hello" }
```

### Type_Property_Optional_StringLiteral_getDefault

- Endpoint: `get /type/property/optional/string/literal/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_StringLiteral_putAll

- Endpoint: `put /type/property/optional/string/literal/all`

Expected request body:

```json
{ "property": "hello" }
```

### Type_Property_Optional_StringLiteral_putDefault

- Endpoint: `put /type/property/optional/string/literal/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_UnionFloatLiteral_getAll

- Endpoint: `get /type/property/optional/union/float/literal/all`

Expected response body:

```json
{ "property": 2.375 }
```

### Type_Property_Optional_UnionFloatLiteral_getDefault

- Endpoint: `get /type/property/optional/union/float/literal/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_UnionFloatLiteral_putAll

- Endpoint: `put /type/property/optional/union/float/literal/all`

Expected request body:

```json
{ "property": 2.375 }
```

### Type_Property_Optional_UnionFloatLiteral_putDefault

- Endpoint: `put /type/property/optional/union/float/literal/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_UnionIntLiteral_getAll

- Endpoint: `get /type/property/optional/union/int/literal/all`

Expected response body:

```json
{ "property": 2 }
```

### Type_Property_Optional_UnionIntLiteral_getDefault

- Endpoint: `get /type/property/optional/union/int/literal/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_UnionIntLiteral_putAll

- Endpoint: `put /type/property/optional/union/int/literal/all`

Expected request body:

```json
{ "property": 2 }
```

### Type_Property_Optional_UnionIntLiteral_putDefault

- Endpoint: `put /type/property/optional/union/int/literal/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_UnionStringLiteral_getAll

- Endpoint: `get /type/property/optional/union/string/literal/all`

Expected response body:

```json
{ "property": "world" }
```

### Type_Property_Optional_UnionStringLiteral_getDefault

- Endpoint: `get /type/property/optional/union/string/literal/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_UnionStringLiteral_putAll

- Endpoint: `put /type/property/optional/union/string/literal/all`

Expected request body:

```json
{ "property": "world" }
```

### Type_Property_Optional_UnionStringLiteral_putDefault

- Endpoint: `put /type/property/optional/union/string/literal/default`

Expected request body:

```json
{}
```

### Type_Property_ValueTypes_Boolean_get

- Endpoint: `get /type/property/value-types/boolean`

Expected response body:

```json
{ "property": true }
```

### Type_Property_ValueTypes_Boolean_put

- Endpoint: `put /type/property/value-types/boolean`

Expected input body:

```json
{ "property": true }
```

### Type_Property_ValueTypes_BooleanLiteral_get

- Endpoint: `get /type/property/value-types/boolean/literal`

Expected response body:

```json
{ "property": true }
```

### Type_Property_ValueTypes_BooleanLiteral_put

- Endpoint: `put /type/property/value-types/boolean/literal`

Expected input body:

```json
{ "property": true }
```

### Type_Property_ValueTypes_Bytes_get

- Endpoint: `get /type/property/value-types/bytes`

Expected response body:

```json
{"property": aGVsbG8sIHdvcmxkIQ==}
```

### Type_Property_ValueTypes_Bytes_put

- Endpoint: `put /type/property/value-types/bytes`

Expected input body:

```json
{"property": aGVsbG8sIHdvcmxkIQ==}
```

### Type_Property_ValueTypes_CollectionsInt_get

- Endpoint: `get /type/property/value-types/collections/int`

Expected response body:

```json
{ "property": [1, 2] }
```

### Type_Property_ValueTypes_CollectionsInt_put

- Endpoint: `put /type/property/value-types/collections/int`

Expected input body:

```json
{ "property": [1, 2] }
```

### Type_Property_ValueTypes_CollectionsModel_get

- Endpoint: `get /type/property/value-types/collections/model`

Expected response body:

```json
{ "property": [{ "property": "hello" }, { "property": "world" }] }
```

### Type_Property_ValueTypes_CollectionsModel_put

- Endpoint: `put /type/property/value-types/collections/model`

Expected input body:

```json
{ "property": [{ "property": "hello" }, { "property": "world" }] }
```

### Type_Property_ValueTypes_CollectionsString_get

- Endpoint: `get /type/property/value-types/collections/string`

Expected response body:

```json
{ "property": ["hello", "world"] }
```

### Type_Property_ValueTypes_CollectionsString_put

- Endpoint: `put /type/property/value-types/collections/string`

Expected input body:

```json
{ "property": ["hello", "world"] }
```

### Type_Property_ValueTypes_Datetime_get

- Endpoint: `get /type/property/value-types/datetime`

Expected response body:

```json
{"property": 2022-08-26T18:38:00Z}
```

### Type_Property_ValueTypes_Datetime_put

- Endpoint: `put /type/property/value-types/datetime`

Expected input body:

```json
{"property": 2022-08-26T18:38:00Z}
```

### Type_Property_ValueTypes_Decimal_get

- Endpoint: `get /type/property/value-types/decimal`

Expected response body:

```json
{ "property": 0.33333 }
```

### Type_Property_ValueTypes_Decimal_put

- Endpoint: `put /type/property/value-types/decimal`

Expected input body:

```json
{ "property": 0.33333 }
```

### Type_Property_ValueTypes_Decimal128_get

- Endpoint: `get /type/property/value-types/decimal128`

Expected response body:

```json
{ "property": 0.33333 }
```

### Type_Property_ValueTypes_Decimal128_put

- Endpoint: `put /type/property/value-types/decimal128`

Expected input body:

```json
{ "property": 0.33333 }
```

### Type_Property_ValueTypes_DictionaryString_get

- Endpoint: `get /type/property/value-types/dictionary/string`

Expected response body:

```json
{ "property": { "k1": "hello", "k2": "world" } }
```

### Type_Property_ValueTypes_DictionaryString_put

- Endpoint: `put /type/property/value-types/dictionary/string`

Expected input body:

```json
{ "property": { "k1": "hello", "k2": "world" } }
```

### Type_Property_ValueTypes_Duration_get

- Endpoint: `get /type/property/value-types/duration`

Expected response body:

```json
{"property": P123DT22H14M12.011S}
```

### Type_Property_ValueTypes_Duration_put

- Endpoint: `put /type/property/value-types/duration`

Expected input body:

```json
{"property": P123DT22H14M12.011S}
```

### Type_Property_ValueTypes_Enum_get

- Endpoint: `get /type/property/value-types/enum`

Expected response body:

```json
{ "property": "ValueOne" }
```

### Type_Property_ValueTypes_Enum_put

- Endpoint: `put /type/property/value-types/enum`

Expected input body:

```json
{ "property": "ValueOne" }
```

### Type_Property_ValueTypes_ExtensibleEnum_get

- Endpoint: `get /type/property/value-types/extensible-enum`

Expected response body:

```json
{ "property": "UnknownValue" }
```

### Type_Property_ValueTypes_ExtensibleEnum_put

- Endpoint: `put /type/property/value-types/extensible-enum`

Expected input body:

```json
{ "property": "UnknownValue" }
```

### Type_Property_ValueTypes_Float_get

- Endpoint: `get /type/property/value-types/float`

Expected response body:

```json
{ "property": 43.125 }
```

### Type_Property_ValueTypes_Float_put

- Endpoint: `put /type/property/value-types/float`

Expected input body:

```json
{ "property": 43.125 }
```

### Type_Property_ValueTypes_FloatLiteral_get

- Endpoint: `get /type/property/value-types/float/literal`

Expected response body:

```json
{ "property": 43.125 }
```

### Type_Property_ValueTypes_FloatLiteral_put

- Endpoint: `put /type/property/value-types/float/literal`

Expected input body:

```json
{ "property": 43.125 }
```

### Type_Property_ValueTypes_Int_get

- Endpoint: `get /type/property/value-types/int`

Expected response body:

```json
{ "property": 42 }
```

### Type_Property_ValueTypes_Int_put

- Endpoint: `put /type/property/value-types/int`

Expected input body:

```json
{ "property": 42 }
```

### Type_Property_ValueTypes_IntLiteral_get

- Endpoint: `get /type/property/value-types/int/literal`

Expected response body:

```json
{ "property": 42 }
```

### Type_Property_ValueTypes_IntLiteral_put

- Endpoint: `put /type/property/value-types/int/literal`

Expected input body:

```json
{ "property": 42 }
```

### Type_Property_ValueTypes_Model_get

- Endpoint: `get /type/property/value-types/model`

Expected response body:

```json
{ "property": { "property": "hello" } }
```

### Type_Property_ValueTypes_Model_put

- Endpoint: `put /type/property/value-types/model`

Expected input body:

```json
{ "property": { "property": "hello" } }
```

### Type_Property_ValueTypes_Never_get

- Endpoint: `get /type/property/value-types/never`

Expected response body:

```json
{"property": <don't include this property>}
```

### Type_Property_ValueTypes_Never_put

- Endpoint: `put /type/property/value-types/never`

Expected input body:

```json
{"property": <don't include this property>}
```

### Type_Property_ValueTypes_String_get

- Endpoint: `get /type/property/value-types/string`

Expected response body:

```json
{ "property": "hello" }
```

### Type_Property_ValueTypes_String_put

- Endpoint: `put /type/property/value-types/string`

Expected input body:

```json
{ "property": "hello" }
```

### Type_Property_ValueTypes_StringLiteral_get

- Endpoint: `get /type/property/value-types/string/literal`

Expected response body:

```json
{ "property": "hello" }
```

### Type_Property_ValueTypes_StringLiteral_put

- Endpoint: `put /type/property/value-types/string/literal`

Expected input body:

```json
{ "property": "hello" }
```

### Type_Property_ValueTypes_UnionEnumValue_get

- Endpoint: `get /type/property/value-types/union-enum-value`

Expected response body:

```json
{ "property": "value2" }
```

### Type_Property_ValueTypes_UnionEnumValue_put

- Endpoint: `put /type/property/value-types/union-enum-value`

Expected input body:

```json
{ "property": "value2" }
```

### Type_Property_ValueTypes_UnionFloatLiteral_get

- Endpoint: `get /type/property/value-types/union/float/literal`

Expected response body:

```json
{ "property": 46.875 }
```

### Type_Property_ValueTypes_UnionFloatLiteral_put

- Endpoint: `put /type/property/value-types/union/float/literal`

Expected input body:

```json
{ "property": 46.875 }
```

### Type_Property_ValueTypes_UnionIntLiteral_get

- Endpoint: `get /type/property/value-types/union/int/literal`

Expected response body:

```json
{ "property": 42 }
```

### Type_Property_ValueTypes_UnionIntLiteral_put

- Endpoint: `put /type/property/value-types/union/int/literal`

Expected input body:

```json
{ "property": 42 }
```

### Type_Property_ValueTypes_UnionStringLiteral_get

- Endpoint: `get /type/property/value-types/union/string/literal`

Expected response body:

```json
{ "property": "world" }
```

### Type_Property_ValueTypes_UnionStringLiteral_put

- Endpoint: `put /type/property/value-types/union/string/literal`

Expected input body:

```json
{ "property": "world" }
```

### Type_Property_ValueTypes_UnknownArray_get

- Endpoint: `get /type/property/value-types/unknown/array`

Expected response body:

```json
{ "property": ["hello", "world"] }
```

### Type_Property_ValueTypes_UnknownArray_put

- Endpoint: `put /type/property/value-types/unknown/array`

Expected input body:

```json
{ "property": ["hello", "world"] }
```

### Type_Property_ValueTypes_UnknownDict_get

- Endpoint: `get /type/property/value-types/unknown/dict`

Expected response body:

```json
{ "property": { "k1": "hello", "k2": 42 } }
```

### Type_Property_ValueTypes_UnknownDict_put

- Endpoint: `put /type/property/value-types/unknown/dict`

Expected input body:

```json
{ "property": { "k1": "hello", "k2": 42 } }
```

### Type_Property_ValueTypes_UnknownInt_get

- Endpoint: `get /type/property/value-types/unknown/int`

Expected response body:

```json
{ "property": 42 }
```

### Type_Property_ValueTypes_UnknownInt_put

- Endpoint: `put /type/property/value-types/unknown/int`

Expected input body:

```json
{ "property": 42 }
```

### Type_Property_ValueTypes_UnknownString_get

- Endpoint: `get /type/property/value-types/unknown/string`

Expected response body:

```json
{ "property": "hello" }
```

### Type_Property_ValueTypes_UnknownString_put

- Endpoint: `put /type/property/value-types/unknown/string`

Expected input body:

```json
{ "property": "hello" }
```

### Type_Scalar_Boolean_get

- Endpoint: `get /type/scalar/boolean`

Expect to handle a boolean value. Mock api will return true

### Type_Scalar_Boolean_put

- Endpoint: `put /type/scalar/boolean`

Expect to send a boolean value. Mock api expect to receive 'true'

### Type_Scalar_Decimal128Type_requestBody

- Endpoint: `put /type/scalar/decimal128/resquest_body`

Expected input body:

```json
0.33333
```

### Type_Scalar_Decimal128Type_requestParameter

- Endpoint: `get /type/scalar/decimal128/request_parameter`

Expected request parameter:
value=0.33333

### Type_Scalar_Decimal128Type_responseBody

- Endpoint: `get /type/scalar/decimal128/response_body`

Expected response body:

```json
0.33333
```

### Type_Scalar_Decimal128Verify_prepareVerify

- Endpoint: `get /type/scalar/decimal128/prepare_verify`

Get verify values:
[0.1, 0.1, 0.1]

### Type_Scalar_Decimal128Verify_verify

- Endpoint: `post /type/scalar/decimal128/verify`

Expected input body:

```json
0.3
```

### Type_Scalar_DecimalType_requestBody

- Endpoint: `put /type/scalar/decimal/resquest_body`

Expected input body:

```json
0.33333
```

### Type_Scalar_DecimalType_requestParameter

- Endpoint: `get /type/scalar/decimal/request_parameter`

Expected request parameter:
value=0.33333

### Type_Scalar_DecimalType_responseBody

- Endpoint: `get /type/scalar/decimal/response_body`

Expected response body:

```json
0.33333
```

### Type_Scalar_DecimalVerify_prepareVerify

- Endpoint: `get /type/scalar/decimal/prepare_verify`

Get verify values:
[0.1, 0.1, 0.1]

### Type_Scalar_DecimalVerify_verify

- Endpoint: `post /type/scalar/decimal/verify`

Expected input body:

```json
0.3
```

### Type_Scalar_String_get

- Endpoint: `get /type/scalar/string`

Expect to handle a string value. Mock api will return 'test'

### Type_Scalar_String_put

- Endpoint: `put /type/scalar/string`

Expect to send a string value. Mock api expect to receive 'test'

### Type_Scalar_Unknown_get

- Endpoint: `get /type/scalar/unknown`

Expect to handle a unknown type value. Mock api will return 'test'

### Type_Scalar_Unknown_put

- Endpoint: `put /type/scalar/unknown`

Expect to send a string value. Mock api expect to receive 'test'

### Type_Union_EnumsOnly_get

- Endpoint: `get /type/union/enums-only`

Verify a union can be processed in a response:

```tsp
Type.Union.LR | Type.Union.UD
```

Expected response body:

```json
{
  "prop": {
    "lr": "right",
    "ud": "up"
  }
}
```

### Type_Union_EnumsOnly_send

- Endpoint: `get /type/union/enums-only`

Verify a union can be processed in a response:

```tsp
Type.Union.LR | Type.Union.UD
```

Expected request to send body:

```json
{
  "prop": {
    "lr": "right",
    "ud": "up"
  }
}
```

### Type_Union_FloatsOnly_get

- Endpoint: `get /type/union/floats-only`

Verify a union can be processed in a response:

```tsp
1.1 | 2.2 | 3.3
```

Expected response body:

```json
{ "prop": 2.2 }
```

### Type_Union_FloatsOnly_send

- Endpoint: `get /type/union/floats-only`

Verify a union can be processed in a response:

```tsp
1.1 | 2.2 | 3.3
```

Expected request to send body:

```json
{ "prop": 2.2 }
```

### Type_Union_IntsOnly_get

- Endpoint: `get /type/union/ints-only`

Verify a union can be processed in a response:

```tsp
1 | 2 | 3
```

Expected response body:

```json
{ "prop": 2 }
```

### Type_Union_IntsOnly_send

- Endpoint: `get /type/union/ints-only`

Verify a union can be processed in a response:

```tsp
1 | 2 | 3
```

Expected request to send body:

```json
{ "prop": 2 }
```

### Type_Union_MixedLiterals_get

- Endpoint: `get /type/union/mixed-literals`

Verify a union can be processed in a response:

```tsp
"a" | 2 | 3.3 | true
```

Expected response body:

```json
{
  "prop": {
    "stringLiteral": "a",
    "intLiteral": 2,
    "floatLiteral": 3.3,
    "booleanLiteral": true
  }
}
```

### Type_Union_MixedLiterals_send

- Endpoint: `get /type/union/mixed-literals`

Verify a union can be processed in a response:

```tsp
"a" | 2 | 3.3 | true
```

Expected request to send body:

```json
{
  "prop": {
    "stringLiteral": "a",
    "intLiteral": 2,
    "floatLiteral": 3.3,
    "booleanLiteral": true
  }
}
```

### Type_Union_MixedTypes_get

- Endpoint: `get /type/union/mixed-types`

Verify a union can be processed in a response:

```tsp
Type.Union.Cat | "a" | int32 | boolean
```

Expected response body:

```json
{
  "prop": {
    "model": {
      "name": "test"
    },
    "literal": "a",
    "int": 2,
    "boolean": true,
    "array": [
      {
        "name": "test"
      },
      "a",
      2,
      true
    ]
  }
}
```

### Type_Union_MixedTypes_send

- Endpoint: `get /type/union/mixed-types`

Verify a union can be processed in a response:

```tsp
Type.Union.Cat | "a" | int32 | boolean
```

Expected request to send body:

```json
{
  "prop": {
    "model": {
      "name": "test"
    },
    "literal": "a",
    "int": 2,
    "boolean": true,
    "array": [
      {
        "name": "test"
      },
      "a",
      2,
      true
    ]
  }
}
```

### Type_Union_ModelsOnly_get

- Endpoint: `get /type/union/models-only`

Verify a union can be processed in a response:

```tsp
Type.Union.Cat | Type.Union.Dog
```

Expected response body:

```json
{
  "prop": {
    "name": "test"
  }
}
```

### Type_Union_ModelsOnly_send

- Endpoint: `get /type/union/models-only`

Verify a union can be processed in a response:

```tsp
Type.Union.Cat | Type.Union.Dog
```

Expected request to send body:

```json
{
  "prop": {
    "name": "test"
  }
}
```

### Type_Union_StringAndArray_get

- Endpoint: `get /type/union/string-and-array`

Verify a union can be processed in a response:

```tsp
string | string[]
```

Expected response body:

```json
{
  "prop": {
    "string": "test",
    "array": ["test1", "test2"]
  }
}
```

### Type_Union_StringAndArray_send

- Endpoint: `get /type/union/string-and-array`

Verify a union can be processed in a response:

```tsp
string | string[]
```

Expected request to send body:

```json
{
  "prop": {
    "string": "test",
    "array": ["test1", "test2"]
  }
}
```

### Type_Union_StringExtensible_get

- Endpoint: `get /type/union/string-extensible`

Verify a union can be processed in a response:

```tsp
string | "b" | "c"
```

Expected response body:

```json
{ "prop": "custom" }
```

### Type_Union_StringExtensible_send

- Endpoint: `get /type/union/string-extensible`

Verify a union can be processed in a response:

```tsp
string | "b" | "c"
```

Expected request to send body:

```json
{ "prop": "custom" }
```

### Type_Union_StringExtensibleNamed_get

- Endpoint: `get /type/union/string-extensible-named`

Verify a union can be processed in a response:

```tsp
Type.Union.StringExtensibleNamedUnion
```

Expected response body:

```json
{ "prop": "custom" }
```

### Type_Union_StringExtensibleNamed_send

- Endpoint: `get /type/union/string-extensible-named`

Verify a union can be processed in a response:

```tsp
Type.Union.StringExtensibleNamedUnion
```

Expected request to send body:

```json
{ "prop": "custom" }
```

### Type_Union_StringsOnly_get

- Endpoint: `get /type/union/strings-only`

Verify a union can be processed in a response:

```tsp
"a" | "b" | "c"
```

Expected response body:

```json
{ "prop": "b" }
```

### Type_Union_StringsOnly_send

- Endpoint: `get /type/union/strings-only`

Verify a union can be processed in a response:

```tsp
"a" | "b" | "c"
```

Expected request to send body:

```json
{ "prop": "b" }
```

### Versioning_Added_InterfaceV2

- Endpoint: `post /versioning/added/api-version:{version}/interface-v2/v2`

This operation group should only be generated with latest version.

Expected request body for v2InInterface:

```json
{ "prop": "foo", "enumProp": "enumMember", "unionProp": "bar" }
```

### Versioning_Added_v1

- Endpoint: `post /versioning/added/api-version:{version}/v1`

This operation should be generated with latest version's signature.

Expected request body:

```json
{ "prop": "foo", "enumProp": "enumMemberV2", "unionProp": 10 }
```

Expected header:
header-v2=bar

### Versioning_Added_v2

- Endpoint: `post /versioning/added/api-version:{version}/v2`

This operation should only be generated with latest version.

Expected request body:

```json
{ "prop": "foo", "enumProp": "enumMember", "unionProp": "bar" }
```

### Versioning_MadeOptional_test

- Endpoint: `post /versioning/made-optional/api-version:{version}/test`

This operation should be generated with latest version's signature.

Expected request body:

```json
{ "prop": "foo" }
```

### Versioning_Removed_modelV3

- Endpoint: `post /versioning/removed/api-version:{version}/v3`

path: "/versioning/removed/api-version[:]v1/v3"
Expected request body:

```json
{ "id": "123", "enumProp": "enumMemberV1" }
```

Expected response body:

```json
{ "id": "123", "enumProp": "enumMemberV1" }
```

path: "/versioning/removed/api-version[:]v2preview/v3"
Expected request body:

```json
{ "id": "123" }
```

Expected response body:

```json
{ "id": "123" }
```

path: "/versioning/removed/api-version[:]v2/v3"
Expected request body:

```json
{ "id": "123", "enumProp": "enumMemberV1" }
```

Expected response body:

```json
{ "id": "123", "enumProp": "enumMemberV1" }
```

### Versioning_Removed_v2

- Endpoint: `post /versioning/removed/api-version:{version}/v2`

This operation should be generated with latest version's signature.

Expected request body:

```json
{ "prop": "foo", "enumProp": "enumMemberV2", "unionProp": "bar" }
```

### Versioning_RenamedFrom_NewInterface

- Endpoint: `post /versioning/renamed-from/api-version:{version}/interface/test`

This operation group should only be generated with latest version's signature.

Expected request body for test:

```json
{ "prop": "foo", "enumProp": "newEnumMember", "unionProp": 10 }
```

### Versioning_RenamedFrom_newOp

- Endpoint: `post /versioning/renamed-from/api-version:{version}/test`

This operation should be generated with latest version's signature.

Expected request body:

```json
{ "newProp": "foo", "enumProp": "newEnumMember", "unionProp": 10 }
```

Expected query:
newQuery=bar

### Versioning_ReturnTypeChangedFrom_test

- Endpoint: `post /versioning/return-type-changed-from/api-version:{version}/test`

This operation should be generated with latest version's signature.

Expected request body: "test"
Expected response body: "test"

### Versioning_TypeChangedFrom_test

- Endpoint: `post /versioning/type-changed-from/api-version:{version}/test`

This operation should be generated with latest version's signature.

Expected request body:

```json
{ "prop": "foo", "changedProp": "bar" }
```

Expected query param:
param="baz"
