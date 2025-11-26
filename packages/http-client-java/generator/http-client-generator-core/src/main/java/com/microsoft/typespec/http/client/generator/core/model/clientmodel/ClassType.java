// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel.XmsExtensions;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import io.clientcore.core.credentials.oauth.OAuthTokenRequestContext;
import io.clientcore.core.utils.CoreUtils;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;

/**
 * The details of a class type that is used by a client.
 */
public class ClassType implements IType {
    private static ClassType withClientCoreReplacement(String azureClass, String clientCoreClass) {
        return withClientCoreAndVNextReplacement(azureClass, clientCoreClass, clientCoreClass);
    }

    private static ClassType withVNextReplacement(String azureClass, String azureVNextClass) {
        return withClientCoreAndVNextReplacement(azureClass, azureVNextClass, azureVNextClass);
    }

    private static ClassType withClientCoreAndVNextReplacement(String azureClass, String clientCoreClass,
        String azureVNextClass) {
        if (JavaSettings.getInstance().isAzureV2()) {
            return new ClassType.Builder(false).knownClass(azureVNextClass).build();
        } else if (!JavaSettings.getInstance().isAzureV1()) {
            return new ClassType.Builder(false).knownClass(clientCoreClass).build();
        } else {
            return new ClassType.Builder(false).knownClass(azureClass).build();
        }
    }

    private static Builder withClientCoreReplacementBuilder(String azureClass, String clientCoreClass,
        boolean isSwaggerType) {
        if (JavaSettings.getInstance().isAzureV2()) {
            return new ClassType.Builder(isSwaggerType).knownClass(clientCoreClass);
        } else if (!JavaSettings.getInstance().isAzureV1()) {
            return new ClassType.Builder(isSwaggerType).knownClass(clientCoreClass);
        } else {
            return new ClassType.Builder(isSwaggerType).knownClass(azureClass);
        }
    }

    private static Builder withVNextReplacementBuilder(String azureClass, String azureVNextClass,
        boolean isSwaggerType) {
        if (JavaSettings.getInstance().isAzureV2()) {
            return new ClassType.Builder(isSwaggerType).knownClass(azureVNextClass);
        } else if (!JavaSettings.getInstance().isAzureV1()) {
            return new ClassType.Builder(isSwaggerType).knownClass(azureClass);
        } else {
            return new ClassType.Builder(isSwaggerType).knownClass(azureClass);
        }
    }

    // Client builder traits.
    public static final ClassType AZURE_KEY_CREDENTIAL_TRAIT
        = new ClassType("com.azure.core.client.traits", "AzureKeyCredentialTrait");
    public static final ClassType KEY_CREDENTIAL_TRAIT = withClientCoreReplacement(
        "com.azure.core.client.traits.KeyCredentialTrait", "io.clientcore.core.traits.KeyCredentialTrait");
    public static final ClassType ENDPOINT_TRAIT = withClientCoreReplacement(
        "com.azure.core.client.traits.EndpointTrait", "io.clientcore.core.traits.EndpointTrait");
    public static final ClassType HTTP_TRAIT
        = withClientCoreReplacement("com.azure.core.client.traits.HttpTrait", "io.clientcore.core.traits.HttpTrait");
    public static final ClassType CONFIGURATION_TRAIT = withClientCoreReplacement(
        "com.azure.core.client.traits.ConfigurationTrait", "io.clientcore.core.traits.ConfigurationTrait");
    public static final ClassType PROXY_TRAIT
        = new ClassType.Builder(false).packageName("io.clientcore.core.traits").name("ProxyTrait").build();
    public static final ClassType TOKEN_CREDENTIAL_TRAIT
        = withClientCoreAndVNextReplacement("com.azure.core.client.traits.TokenCredentialTrait",
            "io.clientcore.core.traits.OAuthTokenCredentialTrait", "com.azure.v2.core.traits.TokenCredentialTrait");

    // Credentials
    public static final ClassType ACCESS_TOKEN = withClientCoreReplacement("com.azure.core.credential.AccessToken",
        "io.clientcore.core.credentials.oauth.AccessToken");
    public static final ClassType AZURE_KEY_CREDENTIAL
        = new Builder(false).packageName("com.azure.core.credential").name("AccessToken").build();
    public static final ClassType KEY_CREDENTIAL = withClientCoreReplacement("com.azure.core.credential.KeyCredential",
        "io.clientcore.core.credentials.KeyCredential");
    public static final ClassType TOKEN_CREDENTIAL = withClientCoreAndVNextReplacement(
        "com.azure.core.credential.TokenCredential", "io.clientcore.core.credentials.oauth.OAuthTokenCredential",
        "com.azure.v2.core.credentials.TokenCredential");
    public static final ClassType OAUTH_TOKEN_REQUEST_CONTEXT
        = new Builder(false).knownClass(OAuthTokenRequestContext.class).build();

    // Exceptions
    public static final ClassType HTTP_RESPONSE_EXCEPTION = withClientCoreReplacement(
        "com.azure.core.exception.HttpResponseException", "io.clientcore.core.http.models.HttpResponseException");
    public static final ClassType CLIENT_AUTHENTICATION_EXCEPTION
        = new Builder(false).packageName("com.azure.core.exception").name("ClientAuthenticationException").build();
    public static final ClassType RESOURCE_EXISTS_EXCEPTION
        = new Builder(false).packageName("com.azure.core.exception").name("ResourceExistsException").build();
    public static final ClassType RESOURCE_MODIFIED_EXCEPTION
        = new Builder(false).packageName("com.azure.core.exception").name("ResourceModifiedException").build();
    public static final ClassType RESOURCE_NOT_FOUND_EXCEPTION
        = new Builder(false).packageName("com.azure.core.exception").name("ResourceNotFoundException").build();
    public static final ClassType TOO_MANY_REDIRECTS_EXCEPTION
        = new Builder(false).packageName("com.azure.core.exception").name("TooManyRedirectsException").build();
    public static final ClassType RESPONSE_ERROR = withVNextReplacementBuilder("com.azure.core.models.ResponseError",
        "com.azure.v2.core.models.AzureResponseError", true).jsonToken("JsonToken.START_OBJECT").build();
    public static final ClassType RESPONSE_INNER_ERROR
        = withVNextReplacementBuilder("com.azure.core.models.ResponseErrorInner",
            "com.azure.v2.core.models.AzureResponseErrorInner", true).jsonToken("JsonToken.START_OBJECT").build();

    // HTTP
    public static final ClassType HTTP_PIPELINE = withClientCoreReplacement("com.azure.core.http.HttpPipeline",
        "io.clientcore.core.http.pipeline.HttpPipeline");
    public static final ClassType HTTP_PIPELINE_BUILDER = withClientCoreReplacement(
        "com.azure.core.http.HttpPipelineBuilder", "io.clientcore.core.http.pipeline.HttpPipelineBuilder");
    public static final ClassType HTTP_CLIENT
        = withClientCoreReplacement("com.azure.core.http.HttpClient", "io.clientcore.core.http.client.HttpClient");
    public static final ClassType HTTP_PIPELINE_POSITION = withClientCoreReplacement(
        "com.azure.core.http.HttpPipelinePosition", "io.clientcore.core.http.pipeline.HttpPipelinePosition");
    public static final ClassType REQUEST_CONDITIONS = withClientCoreReplacement(
        "com.azure.core.http.RequestConditions", "io.clientcore.core.http.models.HttpRequestConditions");
    public static final ClassType MATCH_CONDITIONS = withClientCoreReplacement("com.azure.core.http.MatchConditions",
        "io.clientcore.core.http.models.HttpMatchConditions");
    public static final ClassType PROXY_OPTIONS
        = withClientCoreReplacement("com.azure.core.http.ProxyOptions", "io.clientcore.core.http.models.ProxyOptions");
    public static final ClassType HTTP_REQUEST
        = withClientCoreReplacement("com.azure.core.http.HttpRequest", "io.clientcore.core.http.models.HttpRequest");
    public static final ClassType HTTP_HEADERS
        = withClientCoreReplacement("com.azure.core.http.HttpHeaders", "io.clientcore.core.http.models.HttpHeaders");
    public static final ClassType HTTP_HEADER
        = withClientCoreReplacement("com.azure.core.http.HttpHeader", "io.clientcore.core.http.models.HttpHeader");
    public static final ClassType HTTP_HEADER_NAME = withClientCoreReplacement("com.azure.core.http.HttpHeaderName",
        "io.clientcore.core.http.models.HttpHeaderName");
    public static final ClassType HTTP_RESPONSE
        = withClientCoreReplacement("com.azure.core.http.HttpResponse", "io.clientcore.core.http.models.HttpResponse");

    public static final ClassType HTTP_PIPELINE_POLICY = withClientCoreReplacement(
        "com.azure.core.http.policy.HttpPipelinePolicy", "io.clientcore.core.http.pipeline.HttpPipelinePolicy");
    public static final ClassType HTTP_POLICY_PROVIDERS
        = new ClassType("com.azure.core.http.policy", "HttpPolicyProviders");
    public static final ClassType RETRY_OPTIONS = withClientCoreReplacement("com.azure.core.http.policy.RetryOptions",
        "io.clientcore.core.http.pipeline.HttpRetryOptions");
    public static final ClassType ADD_HEADERS_POLICY = withClientCoreReplacement(
        "com.azure.core.http.policy.AddHeadersPolicy", "io.clientcore.core.http.pipeline.AddHeadersPolicy");
    public static final ClassType ADD_HEADERS_FROM_CONTEXT_POLICY
        = new ClassType("com.azure.core.http.policy", "AddHeadersFromContextPolicy");
    public static final ClassType REQUEST_ID_POLICY = withClientCoreReplacement(
        "com.azure.core.http.policy.RequestIdPolicy", "io.clientcore.core.http.pipeline.RequestIdPolicy");
    public static final ClassType RETRY_POLICY = withClientCoreReplacement("com.azure.core.http.policy.RetryPolicy",
        "io.clientcore.core.http.pipeline.HttpRetryPolicy");
    public static final ClassType ADD_DATE_POLICY = withClientCoreReplacement(
        "com.azure.core.http.policy.AddDatePolicy", "io.clientcore.core.http.pipeline.SetDatePolicy");
    public static final ClassType HTTP_LOGGING_POLICY = withClientCoreReplacement(
        "com.azure.core.http.policy.HttpLoggingPolicy", "io.clientcore.core.http.pipeline.HttpInstrumentationPolicy");
    public static final ClassType HTTP_LOG_OPTIONS = withClientCoreReplacement(
        "com.azure.core.http.policy.HttpLogOptions", "io.clientcore.core.http.pipeline.HttpInstrumentationOptions");
    public static final ClassType HTTP_LOG_DETAIL_LEVEL
        = withClientCoreReplacement("com.azure.core.http.policy.HttpLogDetailLevel",
            "io.clientcore.core.http.pipeline.HttpInstrumentationOptions.HttpLogLevel");
    public static final ClassType USER_AGENT_POLICY = withClientCoreReplacement(
        "com.azure.core.http.policy.UserAgentPolicy", "io.clientcore.core.http.pipeline.UserAgentPolicy");
    public static final ClassType USER_AGENT_OPTIONS
        = new ClassType("io.clientcore.core.http.pipeline", "UserAgentOptions");
    public static final ClassType REDIRECT_POLICY = withClientCoreReplacement(
        "com.azure.core.http.policy.RedirectPolicy", "io.clientcore.core.http.pipeline.HttpRedirectPolicy");
    public static final ClassType REDIRECT_OPTIONS
        = new ClassType("io.clientcore.core.http.pipeline", "HttpRedirectOptions");
    public static final ClassType AZURE_KEY_CREDENTIAL_POLICY
        = new ClassType("com.azure.core.http.policy", "AzureKeyCredentialPolicy");
    public static final ClassType KEY_CREDENTIAL_POLICY = withClientCoreReplacement(
        "com.azure.core.http.policy.KeyCredentialPolicy", "io.clientcore.core.http.pipeline.KeyCredentialPolicy");
    public static final ClassType BEARER_TOKEN_POLICY
        = withClientCoreAndVNextReplacement("com.azure.core.http.policy.BearerTokenAuthenticationPolicy",
            "io.clientcore.core.http.pipeline.OAuthBearerTokenAuthenticationPolicy",
            "com.azure.v2.core.http.pipeline.BearerTokenAuthenticationPolicy");

    public static final ClassType REST_PROXY
        = withClientCoreReplacement("com.azure.core.http.rest.RestProxy", "io.clientcore.core.http.RestProxy");
    public static final ClassType PAGED_ITERABLE = withClientCoreReplacement("com.azure.core.http.rest.PagedIterable",
        "io.clientcore.core.http.paging.PagedIterable");
    public static final ClassType PAGED_FLUX = new ClassType("com.azure.core.http.rest", "PagedFlux");
    public static final ClassType RESPONSE
        = withClientCoreReplacement("com.azure.core.http.rest.Response", "io.clientcore.core.http.models.Response");
    public static final ClassType RESPONSE_BASE = new ClassType("com.azure.core.http.rest", "ResponseBase");
    public static final ClassType PAGED_RESPONSE = withClientCoreReplacement("com.azure.core.http.rest.PagedResponse",
        "io.clientcore.core.http.paging.PagedResponse");
    public static final ClassType PAGED_RESPONSE_BASE = new ClassType("com.azure.core.http.rest", "PagedResponseBase");
    public static final ClassType SIMPLE_RESPONSE = new ClassType("com.azure.core.http.rest", "SimpleResponse");
    public static final ClassType STREAM_RESPONSE = new ClassType("com.azure.core.http.rest", "StreamResponse");
    public static final ClassType REQUEST_OPTIONS = new ClassType("com.azure.core.http.rest", "RequestOptions");

    // Models
    public static final ClassType AZURE_CLOUD
        = withVNextReplacement("com.azure.core.models.AzureCloud", "com.azure.v2.core.models.AzureCloud");
    public static final ClassType JSON_PATCH_DOCUMENT
        = withClientCoreReplacementBuilder("com.azure.core.models.JsonPatchDocument",
            "io.clientcore.core.serialization.json.models.JsonPatchDocument", true).jsonToken("JsonToken.START_OBJECT")
                .build();

    // Serialization
    public static final ClassType JSON_SERIALIZABLE = withClientCoreReplacement("com.azure.json.JsonSerializable",
        "io.clientcore.core.serialization.json.JsonSerializable");
    public static final ClassType JSON_WRITER
        = withClientCoreReplacement("com.azure.json.JsonWriter", "io.clientcore.core.serialization.json.JsonWriter");
    public static final ClassType JSON_READER
        = withClientCoreReplacement("com.azure.json.JsonReader", "io.clientcore.core.serialization.json.JsonReader");
    public static final ClassType JSON_TOKEN
        = withClientCoreReplacement("com.azure.json.JsonToken", "io.clientcore.core.serialization.json.JsonToken");

    public static final ClassType XML_SERIALIZABLE = withClientCoreReplacement("com.azure.xml.XmlSerializable",
        "io.clientcore.core.serialization.xml.XmlSerializable");
    public static final ClassType XML_WRITER
        = withClientCoreReplacement("com.azure.xml.XmlWriter", "io.clientcore.core.serialization.xml.XmlWriter");
    public static final ClassType XML_READER
        = withClientCoreReplacement("com.azure.xml.XmlReader", "io.clientcore.core.serialization.xml.XmlReader");
    public static final ClassType XML_TOKEN
        = withClientCoreReplacement("com.azure.xml.XmlToken", "io.clientcore.core.serialization.xml.XmlToken");

    public static final ClassType SERIALIZER_ADAPTER
        = new ClassType("com.azure.core.util.serializer", "SerializerAdapter");
    public static final ClassType SERIALIZER_ENCODING
        = new ClassType("com.azure.core.util.serializer", "SerializerEncoding");
    public static final ClassType JACKSON_ADAPTER = new ClassType("com.azure.core.util.serializer", "JacksonAdapter");
    public static final ClassType COLLECTION_FORMAT
        = new ClassType("com.azure.core.util.serializer", "CollectionFormat");
    public static final ClassType TYPE_REFERENCE = new ClassType("com.azure.core.util.serializer", "TypeReference");
    public static final ClassType SERIALIZER_FACTORY
        = new ClassType("com.azure.core.management.serializer", "SerializerFactory");
    public static final ClassType JSON_SERIALIZER = withClientCoreReplacement(
        "com.azure.core.util.serializer.JsonSerializer", "io.clientcore.core.serialization.json.JsonSerializer");

    // Utils
    public static final ClassType CORE_UTILS
        = withClientCoreReplacement("com.azure.core.util.CoreUtils", "io.clientcore.core.utils.CoreUtils");
    public static final ClassType EXPANDABLE_STRING_ENUM = withClientCoreReplacement(
        "com.azure.core.util.ExpandableStringEnum", "io.clientcore.core.utils.ExpandableEnum");
    public static final ClassType EXPANDABLE_ENUM
        = withClientCoreReplacement("com.azure.core.util.ExpandableEnum", "io.clientcore.core.utils.ExpandableEnum");
    public static final ClassType URL_BUILDER
        = withClientCoreReplacement("com.azure.core.util.UrlBuilder", "io.clientcore.core.utils.UriBuilder");
    public static final ClassType FLUX_UTIL = new ClassType("com.azure.core.util", "FluxUtil");
    public static final ClassType CONTEXT
        = withClientCoreReplacementBuilder("com.azure.core.util.Context", "io.clientcore.core.utils.Context", false)
            .defaultValueExpressionConverter(
                epr -> (JavaSettings.getInstance().isAzureV1() ? "com.azure.core.util." : "io.clientcore.core.utils.")
                    + TemplateUtil.getContextNone())
            .build();
    public static final ClassType CLIENT_OPTIONS = new ClassType("com.azure.core.util", "ClientOptions");
    public static final ClassType BASE_64_UTIL = new ClassType("com.azure.core.util", "Base64Util");
    public static final ClassType CONFIGURATION = withClientCoreReplacement("com.azure.core.util.Configuration",
        "io.clientcore.core.utils.configuration.Configuration");
    public static final ClassType SERVICE_VERSION = withClientCoreReplacement("com.azure.core.util.ServiceVersion",
        "io.clientcore.core.http.models.ServiceVersion");

    public static final ClassType CLIENT_BUILDER_UTIL
        = new ClassType("com.azure.core.util.builder", "ClientBuilderUtil");

    public static final ClassType CLIENT_LOGGER = withClientCoreReplacement("com.azure.core.util.logging.ClientLogger",
        "io.clientcore.core.instrumentation.logging.ClientLogger");
    public static final ClassType LOG_LEVEL = withClientCoreReplacement("com.azure.core.util.logging.LogLevel",
        "io.clientcore.core.instrumentation.logging.LogLevel");

    public static final ClassType POLL_OPERATION_DETAILS
        = new ClassType("com.azure.core.util.polling", "PollOperationDetails");
    public static final ClassType ASYNC_POLL_RESPONSE
        = new ClassType("com.azure.core.util.polling", "AsyncPollResponse");
    public static final ClassType LONG_RUNNING_OPERATION_STATUS
        = new ClassType("com.azure.core.util.polling", "LongRunningOperationStatus");
    public static final ClassType SYNC_POLLER
        = withVNextReplacement("com.azure.core.util.polling.SyncPoller", "com.azure.v2.core.http.polling.Poller");
    public static final ClassType POLLING_STRATEGY_OPTIONS = withVNextReplacement(
        "com.azure.core.util.polling.PollingStrategyOptions", "com.azure.v2.core.http.polling.PollingStrategyOptions");
    public static final ClassType POLLER_FLUX = new ClassType("com.azure.core.util.polling", "PollerFlux");

    // Complex mapped types
    public static final ClassType BASE_64_URL
        = withClientCoreReplacementBuilder("com.azure.core.util.Base64Url", "io.clientcore.core.utils.Base64Uri", false)
            .serializationValueGetterModifier(valueGetter -> "Objects.toString(" + valueGetter + ", null)")
            .jsonToken("JsonToken.STRING")
            .jsonDeserializationMethod("getNullable(nonNullReader -> new "
                + (JavaSettings.getInstance().isAzureV1() ? "Base64Url" : "Base64Uri") + "(nonNullReader.getString()))")
            .serializationMethodBase("writeString")
            .xmlElementDeserializationMethod(
                "getNullableElement(" + (JavaSettings.getInstance().isAzureV1() ? "Base64Url" : "Base64Uri") + "::new)")
            .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, "
                + (JavaSettings.getInstance().isAzureV1() ? "Base64Url" : "Base64Uri") + "::new)")
            .build();

    public static final ClassType BINARY_DATA = withClientCoreReplacementBuilder("com.azure.core.util.BinaryData",
        "io.clientcore.core.models.binarydata.BinaryData", false)
            .defaultValueExpressionConverter(
                defaultValueExpression -> "BinaryData.fromObject(\"" + defaultValueExpression + "\")")
            // When used as model property, serialization code will not use the "writeUntyped(nullableVar)",
            // because some backend would fail the request on "null" value.
            .serializationMethodBase("writeUntyped")
            .serializationValueGetterModifier(
                valueGetter -> valueGetter + " == null ? null : " + valueGetter + ".toObject(Object.class)")
            .jsonDeserializationMethod(
                "getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped()))")
            .xmlElementDeserializationMethod("getNullableElement(BinaryData::fromObject)")
            .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, BinaryData::fromObject)")
            .build();

    public static final ClassType DATE_TIME_RFC_1123
        = withClientCoreReplacementBuilder("com.azure.core.util.DateTimeRfc1123",
            "io.clientcore.core.utils.DateTimeRfc1123", false)
                .defaultValueExpressionConverter(
                    defaultValueExpression -> "new DateTimeRfc1123(\"" + defaultValueExpression + "\")")
                .jsonToken("JsonToken.STRING")
                .serializationValueGetterModifier(valueGetter -> "Objects.toString(" + valueGetter + ", null)")
                .jsonDeserializationMethod(
                    "getNullable(nonNullReader -> new DateTimeRfc1123(nonNullReader.getString()))")
                .serializationMethodBase("writeString")
                .xmlElementDeserializationMethod("getNullableElement(DateTimeRfc1123::new)")
                .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, DateTimeRfc1123::new)")
                .build();

    // Management
    public static final ClassType SYNC_POLLER_FACTORY
        = new ClassType("com.azure.core.management.polling", "SyncPollerFactory");
    public static final ClassType POLLER_FACTORY = new ClassType("com.azure.core.management.polling", "PollerFactory");
    public static final ClassType POLL_RESULT = new ClassType("com.azure.core.management.polling", "PollResult");
    public static final ClassType AZURE_ENVIRONMENT = new ClassType("com.azure.core.management", "AzureEnvironment");

    // ClientCore only types
    public static final ClassType INSTRUMENTATION
        = new ClassType("io.clientcore.core.instrumentation", "Instrumentation");
    public static final ClassType SDK_INSTRUMENTATION_OPTIONS
        = new ClassType("io.clientcore.core.instrumentation", "SdkInstrumentationOptions");
    public static final ClassType REQUEST_CONTEXT = new ClassType("io.clientcore.core.http.models", "RequestContext");

    // Java types
    public static final ClassType VOID = new ClassType.Builder(false).knownClass(Void.class).build();

    public static final ClassType BOOLEAN = new Builder(false).knownClass(Boolean.class)
        .defaultValueExpressionConverter(String::toLowerCase)
        .jsonToken("JsonToken.BOOLEAN")
        .jsonDeserializationMethod("getNullable(JsonReader::getBoolean)")
        .serializationMethodBase("writeBoolean")
        .xmlElementDeserializationMethod("getNullableElement(Boolean::parseBoolean)")
        .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, Boolean::parseBoolean)")
        .build();

    public static final ClassType BYTE = new Builder(false).knownClass(Byte.class)
        .jsonDeserializationMethod("getNullable(JsonReader::getInt)")
        .jsonToken("JsonToken.NUMBER")
        .serializationMethodBase("writeNumber")
        .xmlElementDeserializationMethod("getNullableElement(Byte::parseByte)")
        .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, Byte::parseByte)")
        .build();

    public static final ClassType INTEGER = new Builder(false).knownClass(Integer.class)
        .defaultValueExpressionConverter(Function.identity())
        .jsonToken("JsonToken.NUMBER")
        .jsonDeserializationMethod("getNullable(JsonReader::getInt)")
        .serializationMethodBase("writeNumber")
        .xmlElementDeserializationMethod("getNullableElement(Integer::parseInt)")
        .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, Integer::parseInt)")
        .build();

    public static final ClassType INTEGER_AS_STRING = new Builder(false).knownClass(Integer.class)
        .defaultValueExpressionConverter(
            defaultValueExpression -> "Integer.parseInt(\"" + defaultValueExpression + "\")")
        .jsonToken("JsonToken.NUMBER")
        .jsonDeserializationMethod("getNullable(nonNullReader -> Integer.parseInt(nonNullReader.getString()))")
        .serializationMethodBase("writeString")
        .serializationValueGetterModifier(valueGetter -> "Objects.toString(" + valueGetter + ", null)")
        .xmlElementDeserializationMethod("getNullableElement(Integer::valueOf)")
        .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, Integer::valueOf)")
        .build();

    public static final ClassType LONG = new Builder(false).prototypeAsLong().build();

    public static final ClassType LONG_AS_STRING = new Builder(false).prototypeAsLong()
        .defaultValueExpressionConverter(defaultValueExpression -> "Long.parseLong(\"" + defaultValueExpression + "\")")
        .jsonToken("JsonToken.STRING")
        .jsonDeserializationMethod("getNullable(nonNullReader -> Long.parseLong(nonNullReader.getString()))")
        .serializationMethodBase("writeString")
        .serializationValueGetterModifier(valueGetter -> "Objects.toString(" + valueGetter + ", null)")
        .xmlElementDeserializationMethod("getNullableElement(Long::valueOf)")
        .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, Long::valueOf)")
        .build();

    public static final ClassType FLOAT = new Builder(false).knownClass(Float.class)
        .defaultValueExpressionConverter(defaultValueExpression -> Float.parseFloat(defaultValueExpression) + "F")
        .jsonToken("JsonToken.NUMBER")
        .jsonDeserializationMethod("getNullable(JsonReader::getFloat)")
        .serializationMethodBase("writeNumber")
        .xmlElementDeserializationMethod("getNullableElement(Float::parseFloat)")
        .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, Float::parseFloat)")
        .build();

    public static final ClassType DOUBLE = new Builder(false).knownClass(Double.class).prototypeAsDouble().build();

    public static final ClassType CHARACTER = new Builder(false).knownClass(Character.class)
        .defaultValueExpressionConverter(defaultValueExpression -> String.valueOf((defaultValueExpression.charAt(0))))
        .jsonToken("JsonToken.STRING")
        .serializationValueGetterModifier(valueGetter -> "Objects.toString(" + valueGetter + ", null)")
        .jsonDeserializationMethod("getNullable(nonNullReader -> nonNullReader.getString().charAt(0))")
        .serializationMethodBase("writeString")
        .xmlElementDeserializationMethod("getNullableElement(nonNullString -> nonNullString.charAt(0))")
        .xmlAttributeDeserializationTemplate(
            "%s.getNullableAttribute(%s, %s, nonNullString -> nonNullString.charAt(0))")
        .build();

    public static final ClassType STRING = new Builder(false).knownClass(String.class)
        .defaultValueExpressionConverter(
            defaultValueExpression -> "\"" + TemplateUtil.escapeString(defaultValueExpression) + "\"")
        .jsonToken("JsonToken.STRING")
        .jsonDeserializationMethod("getString()")
        .serializationMethodBase("writeString")
        .xmlElementDeserializationMethod("getStringElement()")
        .xmlAttributeDeserializationTemplate("%s.getStringAttribute(%s, %s)")
        .build();

    public static final ClassType LOCAL_DATE = new Builder(false).knownClass(java.time.LocalDate.class)
        .defaultValueExpressionConverter(
            defaultValueExpression -> "LocalDate.parse(\"" + defaultValueExpression + "\")")
        .jsonToken("JsonToken.STRING")
        .serializationValueGetterModifier(valueGetter -> "Objects.toString(" + valueGetter + ", null)")
        .jsonDeserializationMethod("getNullable(nonNullReader -> LocalDate.parse(nonNullReader.getString()))")
        .serializationMethodBase("writeString")
        .xmlElementDeserializationMethod("getNullableElement(LocalDate::parse)")
        .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, LocalDate::parse)")
        .build();

    public static final ClassType DATE_TIME = new Builder(false).knownClass(OffsetDateTime.class)
        .defaultValueExpressionConverter(
            defaultValueExpression -> "OffsetDateTime.parse(\"" + defaultValueExpression + "\")")
        .jsonToken("JsonToken.STRING")
        .serializationValueGetterModifier(valueGetter -> valueGetter
            + " == null ? null : DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(" + valueGetter + ")")
        .jsonDeserializationMethod(JavaSettings.getInstance().isAzureV1()
            ? ("getNullable(nonNullReader -> " + CORE_UTILS.getName()
                + ".parseBestOffsetDateTime(nonNullReader.getString()))")
            : ("getNullable(nonNullReader -> OffsetDateTime.parse(nonNullReader.getString()))"))
        .serializationMethodBase("writeString")
        .xmlElementDeserializationMethod(JavaSettings.getInstance().isAzureV1()
            ? ("getNullableElement(dateString -> " + CORE_UTILS.getName() + ".parseBestOffsetDateTime(dateString))")
            : ("getNullableElement(dateString -> OffsetDateTime.parse(dateString))"))
        .xmlAttributeDeserializationTemplate(JavaSettings.getInstance().isAzureV1()
            ? ("%s.getNullableAttribute(%s, %s, dateString -> " + CORE_UTILS.getName()
                + ".parseBestOffsetDateTime(dateString))")
            : ("%s.getNullableAttribute(%s, %s, dateString -> OffsetDateTime.parse(dateString))"))
        .build();

    public static final ClassType DURATION = new Builder(false).knownClass(Duration.class)
        .defaultValueExpressionConverter(defaultValueExpression -> "Duration.parse(\"" + defaultValueExpression + "\")")
        .jsonToken("JsonToken.STRING")
        .serializationValueGetterModifier(valueGetter -> JavaSettings.getInstance().isAzureV1()
            ? CORE_UTILS.getName() + ".durationToStringWithDays(" + valueGetter + ")"
            : "Objects.toString(" + valueGetter + ", null)")
        .jsonDeserializationMethod("getNullable(nonNullReader -> Duration.parse(nonNullReader.getString()))")
        .serializationMethodBase("writeString")
        .xmlElementDeserializationMethod("getNullableElement(Duration::parse)")
        .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, Duration::parse)")
        .build();

    public static final ClassType BIG_DECIMAL = new Builder(false).knownClass(BigDecimal.class)
        .defaultValueExpressionConverter(defaultValueExpression -> "new BigDecimal(\"" + defaultValueExpression + "\")")
        .jsonToken("JsonToken.NUMBER")
        .serializationMethodBase("writeNumber")
        .jsonDeserializationMethod("getNullable(nonNullReader -> new BigDecimal(nonNullReader.getString()))")
        .xmlElementDeserializationMethod("getNullableElement(BigDecimal::new)")
        .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, BigDecimal::new)")
        .build();

    public static final ClassType UUID = new Builder(false).knownClass(java.util.UUID.class)
        .defaultValueExpressionConverter(
            defaultValueExpression -> "UUID.fromString(\"" + defaultValueExpression + "\")")
        .jsonToken("JsonToken.STRING")
        .serializationValueGetterModifier(valueGetter -> "Objects.toString(" + valueGetter + ", null)")
        .jsonDeserializationMethod("getNullable(nonNullReader -> UUID.fromString(nonNullReader.getString()))")
        .serializationMethodBase("writeString")
        .xmlElementDeserializationMethod("getNullableElement(UUID::fromString)")
        .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, UUID::fromString)")
        .build();

    public static final ClassType UNIX_TIME_DATE_TIME = new ClassType.Builder(false)
        .defaultValueExpressionConverter(
            defaultValueExpression -> "OffsetDateTime.parse(\"" + defaultValueExpression + "\")")
        .jsonToken("JsonToken.STRING")
        .knownClass(OffsetDateTime.class)
        .serializationValueGetterModifier(valueGetter -> "Objects.toString(" + valueGetter + ", null)")
        .jsonDeserializationMethod("getNullable(nonNullReader -> OffsetDateTime.parse(nonNullReader.getString()))")
        .serializationMethodBase("writeString")
        .xmlElementDeserializationMethod("getNullableElement(OffsetDateTime::parse)")
        .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, OffsetDateTime::parse)")
        .build();

    public static final ClassType UNIX_TIME_LONG = new ClassType.Builder(false).prototypeAsLong().build();
    public static final ClassType DURATION_LONG = new ClassType.Builder(false).prototypeAsLong().build();
    public static final ClassType DURATION_DOUBLE = new ClassType.Builder(false).prototypeAsDouble().build();

    public static final ClassType URL = new Builder(false)
        .defaultValueExpressionConverter(defaultValueExpression -> "new URL(\"" + defaultValueExpression + "\")")
        .knownClass(java.net.URL.class)
        .jsonToken("JsonToken.STRING")
        .serializationValueGetterModifier(valueGetter -> "Objects.toString(" + valueGetter + ", null)")
        .jsonDeserializationMethod("getNullable(nonNullReader -> new URL(nonNullReader.getString()))")
        .serializationMethodBase("writeString")
        .xmlElementDeserializationMethod(
            "getNullableElement(urlString -> { try { return new URL(urlString); } catch (MalformedURLException e) { throw new XMLStreamException(e); } })")
        .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, URL::new)")
        .build();

    public static final ClassType OBJECT = new ClassType(Object.class);
    public static final ClassType FUNCTION = new ClassType(Function.class);
    public static final ClassType BYTE_BUFFER = new ClassType(ByteBuffer.class);
    public static final ClassType INPUT_STREAM = new ClassType(InputStream.class);

    // Reactor types
    public static final ClassType MONO = new ClassType("reactor.core.publisher", "Mono");
    public static final ClassType FLUX = new ClassType("reactor.core.publisher", "Flux");

    private final String fullName;
    private final String packageName;
    private final String name;
    private final List<String> implementationImports;
    private final XmsExtensions extensions;
    private final Function<String, String> defaultValueExpressionConverter;
    private final boolean isSwaggerType;
    private final Function<String, String> serializationValueGetterModifier;
    private final String jsonToken;
    private final String serializationMethodBase;
    private final String jsonDeserializationMethod;
    private final String xmlAttributeDeserializationTemplate;
    private final String xmlElementDeserializationMethod;
    private final boolean usedInXml;

    private ClassType(Class<?> knownClass) {
        this(knownClass.getPackage().getName(), knownClass.getSimpleName());
    }

    private ClassType(String packageName, String name) {
        this(packageName, name, null, null, null, false, null, null, null, null, null, null, false);
    }

    private ClassType(String packageName, String name, List<String> implementationImports, XmsExtensions extensions,
        Function<String, String> defaultValueExpressionConverter, boolean isSwaggerType, String jsonToken,
        String serializationMethodBase, Function<String, String> serializationValueGetterModifier,
        String jsonDeserializationMethod, String xmlAttributeDeserializationTemplate,
        String xmlElementDeserializationMethod, boolean usedInXml) {
        this.fullName = packageName + "." + name;
        this.packageName = packageName;
        this.name = name;
        this.implementationImports = implementationImports;
        this.extensions = extensions;
        this.defaultValueExpressionConverter = defaultValueExpressionConverter;
        this.isSwaggerType = isSwaggerType;
        this.jsonToken = jsonToken;
        this.serializationMethodBase = serializationMethodBase;
        this.serializationValueGetterModifier = serializationValueGetterModifier;
        this.jsonDeserializationMethod = jsonDeserializationMethod;
        this.xmlAttributeDeserializationTemplate = xmlAttributeDeserializationTemplate;
        this.xmlElementDeserializationMethod = xmlElementDeserializationMethod;
        this.usedInXml = usedInXml;
    }

    public final String getPackage() {
        return packageName;
    }

    public final String getName() {
        return name;
    }

    private List<String> getImplementationImports() {
        return implementationImports;
    }

    public XmsExtensions getExtensions() {
        return extensions;
    }

    private Function<String, String> getDefaultValueExpressionConverter() {
        return defaultValueExpressionConverter;
    }

    public final boolean isBoxedType() {
        // TODO (alzimmer): This should be a property on the ClassType
        return this.equals(ClassType.VOID)
            || this.equals(ClassType.BOOLEAN)
            || this.equals(ClassType.BYTE)
            || this.equals(ClassType.INTEGER)
            || this.equals(ClassType.LONG)
            || this.equals(ClassType.FLOAT)
            || this.equals(ClassType.DOUBLE);
    }

    @Override
    public String toString() {
        return name;
    }

    @Override
    public boolean equals(final Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof ClassType)) {
            return false;
        }
        ClassType that = (ClassType) other;
        return Objects.equals(this.name, that.name) && Objects.equals(this.packageName, that.packageName);
    }

    @Override
    public int hashCode() {
        return Objects.hash(packageName, name);
    }

    public final IType asNullable() {
        return this;
    }

    public final boolean contains(IType type) {
        return this.equals(type);
    }

    public final String getFullName() {
        return fullName;
    }

    public final void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        if (!getPackage().equals("java.lang")) {
            imports.add(fullName);
        }

        if (this == ClassType.UNIX_TIME_LONG) {
            imports.add(Instant.class.getName());
            imports.add(ZoneOffset.class.getName());
        }

        if (this == ClassType.DATE_TIME) {
            imports.add(DateTimeFormatter.class.getName());
        }

        if (this == ClassType.DATE_TIME_RFC_1123) {
            // May need OffsetDateTime when consuming DateTimeRfc1123 APIs as DateTimeRfc1123 APIs consume and return
            // OffsetDateTime.
            // If OffsetDateTime isn't needed, when running Spotless the unused import will be removed.
            imports.add(OffsetDateTime.class.getName());
        }

        if (this == ClassType.URL) {
            imports.add(java.net.URL.class.getName());
            imports.add(java.net.MalformedURLException.class.getName());
        }

        if (includeImplementationImports && getImplementationImports() != null) {
            imports.addAll(getImplementationImports());
        }
    }

    public final String defaultValueExpression(String sourceExpression) {
        String result = sourceExpression;
        if (result != null) {
            if (getDefaultValueExpressionConverter() != null) {
                result = defaultValueExpressionConverter.apply(sourceExpression);
            } else {
                result = "new " + this + "()";
            }
        }
        return result;
    }

    @Override
    public String defaultValueExpression() {
        return "null";
    }

    public final IType getClientType() {
        IType clientType = this;
        if (this == ClassType.DATE_TIME_RFC_1123) {
            clientType = ClassType.DATE_TIME;
        } else if (this == ClassType.UNIX_TIME_LONG) {
            clientType = ClassType.DATE_TIME;
        } else if (this == ClassType.BASE_64_URL) {
            clientType = ArrayType.BYTE_ARRAY;
        } else if (this == ClassType.DURATION_LONG) {
            clientType = ClassType.DURATION;
        } else if (this == ClassType.DURATION_DOUBLE) {
            clientType = ClassType.DURATION;
        }
        return clientType;
    }

    public String convertToClientType(String expression) {
        if (this == ClassType.DATE_TIME_RFC_1123) {
            expression = expression + ".getDateTime()";
        } else if (this == ClassType.UNIX_TIME_LONG) {
            expression = "OffsetDateTime.ofInstant(Instant.ofEpochSecond(" + expression + "), ZoneOffset.UTC)";
        } else if (this == ClassType.BASE_64_URL) {
            expression = expression + ".decodedBytes()";
        } else if (this == ClassType.URL) {
            expression = "new URL(" + expression + ")";
        } else if (this == ClassType.DURATION_LONG) {
            expression = "Duration.ofSeconds(" + expression + ")";
        } else if (this == ClassType.DURATION_DOUBLE) {
            expression = "Duration.ofNanos((long) (" + expression + " * 1000_000_000L))";
        }

        return expression;
    }

    public String convertFromClientType(String expression) {
        if (this == ClassType.DATE_TIME_RFC_1123) {
            expression = "new DateTimeRfc1123(" + expression + ")";
        } else if (this == ClassType.UNIX_TIME_LONG) {
            expression = expression + ".toEpochSecond()";
        } else if (this == ClassType.BASE_64_URL) {
            expression = ClassType.BASE_64_URL.getName() + ".encode(" + expression + ")";
        } else if (this == ClassType.URL) {
            expression = expression + ".toString()";
        } else if (this == ClassType.DURATION_LONG) {
            expression = expression + ".getSeconds()";
        } else if (this == ClassType.DURATION_DOUBLE) {
            expression = "(double) " + expression + ".toNanos() / 1000_000_000L";
        }

        return expression;
    }

    public String validate(String expression) {
        if (packageName.startsWith(JavaSettings.getInstance().getPackage())) {
            return expression + ".validate()";
        } else {
            return null;
        }
    }

    public boolean isSwaggerType() {
        return isSwaggerType;
    }

    @Override
    public String jsonToken() {
        return jsonToken;
    }

    @Override
    public String jsonDeserializationMethod(String jsonReaderName) {
        if (jsonDeserializationMethod == null) {
            return null;
        }

        return jsonReaderName + "." + jsonDeserializationMethod;
    }

    @Override
    public String jsonSerializationMethodCall(String jsonWriterName, String fieldName, String valueGetter,
        boolean jsonMergePatch) {
        if (!isSwaggerType && CoreUtils.isNullOrEmpty(serializationMethodBase)) {
            return null;
        }

        String methodBase = isSwaggerType ? "writeJson" : serializationMethodBase;
        String value = serializationValueGetterModifier != null
            ? serializationValueGetterModifier.apply(valueGetter)
            : valueGetter;

        return fieldName == null
            ? jsonWriterName + "." + methodBase + "(" + value + ")"
            : jsonWriterName + "." + methodBase + "Field(\"" + fieldName + "\", " + value + ")";
    }

    @Override
    public String xmlDeserializationMethod(String xmlReaderName, String attributeName, String attributeNamespace,
        boolean namespaceIsConstant) {
        if (attributeName == null) {
            return xmlReaderName + "." + xmlElementDeserializationMethod;
        } else if (attributeNamespace == null) {
            return String.format(xmlAttributeDeserializationTemplate, xmlReaderName, "null",
                "\"" + attributeName + "\"");
        } else {
            String namespace = namespaceIsConstant ? attributeNamespace : "\"" + attributeNamespace + "\"";
            return String.format(xmlAttributeDeserializationTemplate, xmlReaderName, namespace,
                "\"" + attributeName + "\"");
        }
    }

    @Override
    public String xmlSerializationMethodCall(String xmlWriterName, String attributeOrElementName, String namespaceUri,
        String valueGetter, boolean isAttribute, boolean nameIsVariable, boolean namespaceIsConstant) {
        if (isSwaggerType) {
            if (isAttribute) {
                throw new RuntimeException("Swagger types cannot be written as attributes.");
            }

            return xmlWriterName + ".writeXml(" + valueGetter + ", \"" + attributeOrElementName + "\")";
        }

        String value = serializationValueGetterModifier != null
            ? serializationValueGetterModifier.apply(valueGetter)
            : valueGetter;
        return xmlSerializationCallHelper(xmlWriterName, serializationMethodBase, attributeOrElementName, namespaceUri,
            value, isAttribute, nameIsVariable, namespaceIsConstant);
    }

    @Override
    public boolean isUsedInXml() {
        return usedInXml;
    }

    public static class Builder {
        /*
         * Used to indicate if the class type is generated based on a Swagger definition and isn't a pre-defined,
         * handwritten type.
         */
        private final boolean isSwaggerType;

        private String packageName;
        private String name;
        private List<String> implementationImports;
        private XmsExtensions extensions;
        private Function<String, String> defaultValueExpressionConverter;
        private Function<String, String> serializationValueGetterModifier;
        private String jsonToken;
        private String jsonDeserializationMethod;
        private String serializationMethodBase;
        private String xmlAttributeDeserializationTemplate;
        private String xmlElementDeserializationMethod;
        private boolean usedInXml;

        public Builder() {
            this(true);
        }

        private Builder(boolean isSwaggerType) {
            this.isSwaggerType = isSwaggerType;
        }

        public Builder packageName(String packageName) {
            this.packageName = packageName;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder prototypeAsLong() {
            return this.knownClass(Long.class)
                .defaultValueExpressionConverter(defaultValueExpression -> defaultValueExpression + 'L')
                .jsonToken("JsonToken.NUMBER")
                .serializationMethodBase("writeNumber")
                .jsonDeserializationMethod("getNullable(JsonReader::getLong)")
                .xmlElementDeserializationMethod("getNullableElement(Long::parseLong)")
                .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, Long::parseLong)");
        }

        public Builder prototypeAsDouble() {
            return this.knownClass(Double.class)
                .defaultValueExpressionConverter(defaultValueExpression -> java.lang.String
                    .valueOf(java.lang.Double.parseDouble(defaultValueExpression)) + 'D')
                .jsonToken("JsonToken.NUMBER")
                .serializationMethodBase("writeNumber")
                .jsonDeserializationMethod("getNullable(JsonReader::getDouble)")
                .xmlElementDeserializationMethod("getNullableElement(Double::parseDouble)")
                .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, Double::parseDouble)");
        }

        public Builder knownClass(Class<?> clazz) {
            return packageName(clazz.getPackage().getName()).name(clazz.getSimpleName());
        }

        private Builder knownClass(String fullName) {
            int index = fullName.lastIndexOf(".");
            return packageName(fullName.substring(0, index)).name(fullName.substring(index + 1));
        }

        public Builder implementationImports(String... implementationImports) {
            this.implementationImports = Arrays.asList(implementationImports);
            return this;
        }

        public Builder extensions(XmsExtensions extensions) {
            this.extensions = extensions;
            return this;
        }

        public Builder defaultValueExpressionConverter(Function<String, String> defaultValueExpressionConverter) {
            this.defaultValueExpressionConverter = defaultValueExpressionConverter;
            return this;
        }

        public Builder jsonToken(String jsonToken) {
            this.jsonToken = jsonToken;
            return this;
        }

        public Builder serializationValueGetterModifier(Function<String, String> serializationValueGetterModifier) {
            this.serializationValueGetterModifier = serializationValueGetterModifier;
            return this;
        }

        public Builder jsonDeserializationMethod(String jsonDeserializationMethod) {
            this.jsonDeserializationMethod = jsonDeserializationMethod;
            return this;
        }

        public Builder serializationMethodBase(String serializationMethodBase) {
            this.serializationMethodBase = serializationMethodBase;
            return this;
        }

        public Builder xmlAttributeDeserializationTemplate(String xmlAttributeDeserializationTemplate) {
            this.xmlAttributeDeserializationTemplate = xmlAttributeDeserializationTemplate;
            return this;
        }

        public Builder xmlElementDeserializationMethod(String xmlElementDeserializationMethod) {
            this.xmlElementDeserializationMethod = xmlElementDeserializationMethod;
            return this;
        }

        public Builder usedInXml(boolean usedInXml) {
            this.usedInXml = usedInXml;
            return this;
        }

        public ClassType build() {
            // Deserialization of Swagger types needs to be handled differently as the named reader needs
            // to be passed to the deserialization method and the reader name cannot be determined here.
            String jsonDeserializationMethod = isSwaggerType ? null : this.jsonDeserializationMethod;
            String xmlAttributeDeserializationTemplate
                = isSwaggerType ? null : this.xmlAttributeDeserializationTemplate;
            String xmlElementDeserializationMethod = isSwaggerType ? null : this.xmlElementDeserializationMethod;

            return new ClassType(packageName, name, implementationImports, extensions, defaultValueExpressionConverter,
                isSwaggerType, jsonToken, serializationMethodBase, serializationValueGetterModifier,
                jsonDeserializationMethod, xmlAttributeDeserializationTemplate, xmlElementDeserializationMethod,
                usedInXml);
        }
    }

    static String xmlSerializationCallHelper(String writer, String method, String xmlName, String namespace,
        String value, boolean isAttribute, boolean nameIsVariable, boolean namespaceIsConstant) {
        String name = (xmlName == null) ? null : nameIsVariable ? xmlName : "\"" + xmlName + "\"";
        namespace = (namespace == null) ? null : namespaceIsConstant ? namespace : "\"" + namespace + "\"";

        if (isAttribute) {
            method = method + "Attribute";
            return (namespace == null)
                ? writer + "." + method + "(" + name + ", " + value + ")"
                : writer + "." + method + "(" + namespace + ", " + name + ", " + value + ")";
        }

        if (name == null) {
            return writer + "." + method + "(" + value + ")";
        } else {
            method = method + "Element";
            return (namespace == null)
                ? writer + "." + method + "(" + name + ", " + value + ")"
                : writer + "." + method + "(" + namespace + ", " + name + ", " + value + ")";
        }
    }
}
