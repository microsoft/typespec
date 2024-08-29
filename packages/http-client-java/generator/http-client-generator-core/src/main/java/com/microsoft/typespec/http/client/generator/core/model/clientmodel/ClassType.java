// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel.XmsExtensions;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import com.azure.core.client.traits.ConfigurationTrait;
import com.azure.core.client.traits.EndpointTrait;
import com.azure.core.client.traits.HttpTrait;
import com.azure.core.client.traits.KeyCredentialTrait;
import com.azure.core.credential.AzureKeyCredential;
import com.azure.core.credential.KeyCredential;
import com.azure.core.credential.TokenCredential;
import com.azure.core.exception.ClientAuthenticationException;
import com.azure.core.exception.HttpResponseException;
import com.azure.core.exception.ResourceExistsException;
import com.azure.core.exception.ResourceModifiedException;
import com.azure.core.exception.ResourceNotFoundException;
import com.azure.core.exception.TooManyRedirectsException;
import com.azure.core.http.HttpClient;
import com.azure.core.http.HttpHeaderName;
import com.azure.core.http.HttpHeaders;
import com.azure.core.http.HttpPipeline;
import com.azure.core.http.HttpPipelineBuilder;
import com.azure.core.http.HttpRequest;
import com.azure.core.http.MatchConditions;
import com.azure.core.http.ProxyOptions;
import com.azure.core.http.RequestConditions;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.http.policy.HttpPipelinePolicy;
import com.azure.core.http.policy.KeyCredentialPolicy;
import com.azure.core.http.policy.RedirectPolicy;
import com.azure.core.http.policy.RetryOptions;
import com.azure.core.http.policy.RetryPolicy;
import com.azure.core.http.rest.RequestOptions;
import com.azure.core.http.rest.Response;
import com.azure.core.http.rest.RestProxy;
import com.azure.core.http.rest.SimpleResponse;
import com.azure.core.http.rest.StreamResponse;
import com.azure.core.models.JsonPatchDocument;
import com.azure.core.models.ResponseError;
import com.azure.core.util.Base64Url;
import com.azure.core.util.BinaryData;
import com.azure.core.util.ClientOptions;
import com.azure.core.util.Configuration;
import com.azure.core.util.Context;
import com.azure.core.util.CoreUtils;
import com.azure.core.util.DateTimeRfc1123;
import com.azure.core.util.ExpandableStringEnum;
import com.azure.core.util.logging.ClientLogger;
import com.azure.core.util.logging.LogLevel;
import com.azure.core.util.polling.PollOperationDetails;
import com.azure.core.util.serializer.JsonSerializer;
import com.azure.core.util.serializer.SerializerAdapter;
import com.azure.core.util.serializer.TypeReference;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonToken;
import com.azure.json.JsonWriter;

import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;

/**
 * The details of a class type that is used by a client.
 */
public class ClassType implements IType {


  private static class ClassDetails {

    private final Class<?> azureClass;
    private final String genericClass;

    public ClassDetails(Class<?> azureClass, String genericClass) {
      this.azureClass = azureClass;
      this.genericClass = genericClass;
    }

    public String getAzureClass() {
      return azureClass.getName();
    }

    public String getGenericClass() {
      return genericClass;
    }

  }

  private static final Map<Class<?>, ClassDetails> CLASS_TYPE_MAPPING = new HashMap<Class<?>, ClassDetails>() {{
    put(RestProxy.class, new ClassDetails(RestProxy.class, "io.clientcore.core.http.RestProxy"));
    put(HttpPipeline.class, new ClassDetails(HttpPipeline.class, "io.clientcore.core.http.pipeline.HttpPipeline"));
    put(HttpPipelineBuilder.class, new ClassDetails(HttpPipelineBuilder.class, "io.clientcore.core.http.pipeline.HttpPipelineBuilder"));
    put(Context.class, new ClassDetails(Context.class, "io.clientcore.core.util.Context"));
    put(HttpClient.class, new ClassDetails(HttpClient.class, "io.clientcore.core.http.client.HttpClient"));
    put(HttpLogOptions.class, new ClassDetails(HttpLogOptions.class, "io.clientcore.core.http.models.HttpLogOptions"));
    put(HttpPipelinePolicy.class, new ClassDetails(HttpPipelinePolicy.class, "io.clientcore.core.http.pipeline.HttpPipelinePolicy"));
    put(KeyCredentialPolicy.class, new ClassDetails(KeyCredentialPolicy.class, "io.clientcore.core.http.pipeline.KeyCredentialPolicy"));
    put(RetryPolicy.class, new ClassDetails(RetryPolicy.class, "io.clientcore.core.http.pipeline.HttpRetryPolicy"));
    put(RedirectPolicy.class, new ClassDetails(RedirectPolicy.class, "io.clientcore.core.http.pipeline.HttpRedirectPolicy"));
    put(Configuration.class, new ClassDetails(Configuration.class, "io.clientcore.core.util.configuration.Configuration"));
    put(HttpHeaders.class, new ClassDetails(HttpHeaders.class, "io.clientcore.core.models.Headers"));
    put(HttpHeaderName.class, new ClassDetails(HttpHeaderName.class, "io.clientcore.core.http.models.HttpHeaderName"));
    put(HttpRequest.class, new ClassDetails(HttpRequest.class, "io.clientcore.core.http.models.HttpRequest"));
    put(RequestOptions.class, new ClassDetails(RequestOptions.class, "io.clientcore.core.http.models.RequestOptions"));
    put(BinaryData.class, new ClassDetails(BinaryData.class, "io.clientcore.core.util.binarydata.BinaryData"));
    put(RetryOptions.class, new ClassDetails(RetryOptions.class, "io.clientcore.core.http.models.HttpRetryOptions"));
    put(ProxyOptions.class, new ClassDetails(ProxyOptions.class, "io.clientcore.core.http.models.ProxyOptions"));
    put(Response.class, new ClassDetails(Response.class, "io.clientcore.core.http.models.Response"));
    put(SimpleResponse.class, new ClassDetails(SimpleResponse.class, "io.clientcore.core.http.SimpleResponse"));
    put(ExpandableStringEnum.class, new ClassDetails(ExpandableStringEnum.class, "io.clientcore.core.util.ExpandableEnum"));
    put(HttpResponseException.class, new ClassDetails(HttpResponseException.class, "io.clientcore.core.http.exception.HttpResponseException"));
    put(HttpTrait.class, new ClassDetails(HttpTrait.class, "io.clientcore.core.models.traits.HttpTrait"));
    put(ConfigurationTrait.class, new ClassDetails(ConfigurationTrait.class, "io.clientcore.core.models.traits.ConfigurationTrait"));
    put(EndpointTrait.class, new ClassDetails(EndpointTrait.class, "io.clientcore.core.models.traits.EndpointTrait"));
    put(KeyCredentialTrait.class, new ClassDetails(KeyCredentialTrait.class, "io.clientcore.core.models.traits.KeyCredentialTrait"));
    put(TypeReference.class, new ClassDetails(TypeReference.class, "io.clientcore.core.models.TypeReference"));
    put(ClientLogger.class, new ClassDetails(ClientLogger.class, "io.clientcore.core.util.ClientLogger"));
    put(LogLevel.class, new ClassDetails(LogLevel.class, "io.clientcore.core.util.ClientLogger.LogLevel"));
  }};

  private static ClassType.Builder getClassTypeBuilder(Class<?> classKey) {
    if (!JavaSettings.getInstance().isBranded()) {
      if (CLASS_TYPE_MAPPING.containsKey(classKey)) {
        return new ClassType.Builder(false).knownClass(CLASS_TYPE_MAPPING.get(classKey).getGenericClass());
      } else {
        return new Builder(false).packageName(classKey.getPackage().getName()
            .replace(ExternalPackage.AZURE_CORE_PACKAGE_NAME, ExternalPackage.CLIENTCORE_PACKAGE_NAME)
            .replace(ExternalPackage.AZURE_JSON_PACKAGE_NAME, ExternalPackage.CLIENTCORE_JSON_PACKAGE_NAME))
          .name(classKey.getSimpleName());
      }
    } else {
      if (CLASS_TYPE_MAPPING.containsKey(classKey)) {
        return new ClassType.Builder(false).knownClass(CLASS_TYPE_MAPPING.get(classKey).getAzureClass());
      } else {
        return new Builder(false).packageName(classKey.getPackage().getName()).name(classKey.getSimpleName());
      }
    }
  }

  public static final ClassType REQUEST_CONDITIONS = new Builder().knownClass(RequestConditions.class).build();
  public static final ClassType MATCH_CONDITIONS = new Builder().knownClass(MatchConditions.class).build();
  public static final ClassType CORE_UTILS = getClassTypeBuilder(CoreUtils.class).build();
  public static final ClassType RESPONSE = getClassTypeBuilder(Response.class).build();
  public static final ClassType SIMPLE_RESPONSE = getClassTypeBuilder(SimpleResponse.class).build();
  public static final ClassType EXPANDABLE_STRING_ENUM = getClassTypeBuilder(ExpandableStringEnum.class).build();
  public static final ClassType HTTP_PIPELINE_BUILDER = getClassTypeBuilder(HttpPipelineBuilder.class).build();
  public static final ClassType KEY_CREDENTIAL_POLICY = getClassTypeBuilder(KeyCredentialPolicy.class).build();
  public static final ClassType KEY_CREDENTIAL_TRAIT = getClassTypeBuilder(KeyCredentialTrait.class).build();
  public static final ClassType ENDPOINT_TRAIT = getClassTypeBuilder(EndpointTrait.class).build();
  public static final ClassType HTTP_TRAIT = getClassTypeBuilder(HttpTrait.class).build();
  public static final ClassType CONFIGURATION_TRAIT = getClassTypeBuilder(ConfigurationTrait.class).build();
  public static final ClassType PROXY_TRAIT = new ClassType.Builder(false)
    .packageName("io.clientcore.core.models.traits").name("ProxyTrait")
    .build();
  public static final ClassType POLL_OPERATION_DETAILS = getClassTypeBuilder(PollOperationDetails.class).build();
  public static final ClassType JSON_SERIALIZABLE = getClassTypeBuilder(JsonSerializable.class).build();
  public static final ClassType JSON_WRITER = getClassTypeBuilder(JsonWriter.class).build();
  public static final ClassType JSON_READER = getClassTypeBuilder(JsonReader.class).build();
  public static final ClassType JSON_TOKEN = getClassTypeBuilder(JsonToken.class).build();

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

  public static final ClassType INTEGER_AS_STRING = new Builder(false)
    .knownClass(Integer.class)
    .defaultValueExpressionConverter(defaultValueExpression -> "Integer.parseInt(\"" + defaultValueExpression + "\")")
    .jsonToken("JsonToken.NUMBER")
    .jsonDeserializationMethod("getNullable(nonNullReader -> Integer.parseInt(nonNullReader.getString()))")
    .serializationMethodBase("writeString")
    .serializationValueGetterModifier(valueGetter -> "Objects.toString(" + valueGetter + ", null)")
    .xmlElementDeserializationMethod("getNullableElement(Integer::valueOf)")
    .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, Integer::valueOf)")
    .build();

  public static final ClassType LONG = new Builder(false)
    .prototypeAsLong()
    .build();

  public static final ClassType LONG_AS_STRING = new Builder(false)
    .prototypeAsLong()
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

  public static final ClassType DOUBLE = new Builder(false).knownClass(Double.class)
    .prototypeAsDouble()
    .build();

  public static final ClassType CHARACTER = new Builder(false).knownClass(Character.class)
    .defaultValueExpressionConverter(defaultValueExpression -> String.valueOf((defaultValueExpression.charAt(0))))
    .jsonToken("JsonToken.STRING")
    .serializationValueGetterModifier(valueGetter -> "Objects.toString(" + valueGetter + ", null)")
    .jsonDeserializationMethod("getNullable(nonNullReader -> nonNullReader.getString().charAt(0))")
    .serializationMethodBase("writeString")
    .xmlElementDeserializationMethod("getNullableElement(nonNullString -> nonNullString.charAt(0))")
    .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, nonNullString -> nonNullString.charAt(0))")
    .build();

  public static final ClassType STRING = new Builder(false).knownClass(String.class)
    .defaultValueExpressionConverter(defaultValueExpression -> "\"" + TemplateUtil.escapeString(defaultValueExpression) + "\"")
    .jsonToken("JsonToken.STRING")
    .jsonDeserializationMethod("getString()")
    .serializationMethodBase("writeString")
    .xmlElementDeserializationMethod("getStringElement()")
    .xmlAttributeDeserializationTemplate("%s.getStringAttribute(%s, %s)")
    .build();

  public static final ClassType BASE_64_URL = getClassTypeBuilder(Base64Url.class)
    .serializationValueGetterModifier(valueGetter -> "Objects.toString(" + valueGetter + ", null)")
    .jsonToken("JsonToken.STRING")
    .jsonDeserializationMethod("getNullable(nonNullReader -> new Base64Url(nonNullReader.getString()))")
    .serializationMethodBase("writeString")
    .xmlElementDeserializationMethod("getNullableElement(Base64Url::new)")
    .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, Base64Url::new)")
    .build();

  public static final ClassType ANDROID_BASE_64_URL = new ClassType.Builder(false)
    .packageName("com.azure.android.core.util").name("Base64Url")
    .build();

  public static final ClassType LOCAL_DATE = new Builder(false).knownClass(java.time.LocalDate.class)
    .defaultValueExpressionConverter(defaultValueExpression -> "LocalDate.parse(\"" + defaultValueExpression + "\")")
    .jsonToken("JsonToken.STRING")
    .serializationValueGetterModifier(valueGetter -> "Objects.toString(" + valueGetter + ", null)")
    .jsonDeserializationMethod("getNullable(nonNullReader -> LocalDate.parse(nonNullReader.getString()))")
    .serializationMethodBase("writeString")
    .xmlElementDeserializationMethod("getNullableElement(LocalDate::parse)")
    .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, LocalDate::parse)")
    .build();

  public static final ClassType ANDROID_LOCAL_DATE = new ClassType.Builder(false)
    .packageName("org.threeten.bp").name("LocalDate")
    .build();

  public static final ClassType DATE_TIME = new Builder(false).knownClass(OffsetDateTime.class)
    .defaultValueExpressionConverter(defaultValueExpression -> "OffsetDateTime.parse(\"" + defaultValueExpression + "\")")
    .jsonToken("JsonToken.STRING")
    .serializationValueGetterModifier(valueGetter -> valueGetter + " == null ? null : DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(" + valueGetter + ")")
    .jsonDeserializationMethod("getNullable(nonNullReader -> " + CORE_UTILS.getName() + ".parseBestOffsetDateTime(nonNullReader.getString()))")
    .serializationMethodBase("writeString")
    .xmlElementDeserializationMethod("getNullableElement(dateString -> " + CORE_UTILS.getName() + ".parseBestOffsetDateTime(dateString))")
    .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, dateString -> " + CORE_UTILS.getName() + ".parseBestOffsetDateTime(dateString))")
    .build();

  public static final ClassType DURATION = new Builder(false).knownClass(Duration.class)
    .defaultValueExpressionConverter(defaultValueExpression -> "Duration.parse(\"" + defaultValueExpression + "\")")
    .jsonToken("JsonToken.STRING")
    .serializationValueGetterModifier(valueGetter -> CORE_UTILS.getName() + ".durationToStringWithDays(" + valueGetter + ")")
    .jsonDeserializationMethod("getNullable(nonNullReader -> Duration.parse(nonNullReader.getString()))")
    .serializationMethodBase("writeString")
    .xmlElementDeserializationMethod("getNullableElement(Duration::parse)")
    .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, Duration::parse)")
    .build();

  public static final ClassType ANDROID_DURATION = new ClassType.Builder(false)
    .packageName("org.threeten.bp").name("Duration")
    .build();

  public static final ClassType DATE_TIME_RFC_1123 = getClassTypeBuilder(DateTimeRfc1123.class)
    .defaultValueExpressionConverter(defaultValueExpression -> "new DateTimeRfc1123(\"" + defaultValueExpression + "\")")
    .jsonToken("JsonToken.STRING")
    .serializationValueGetterModifier(valueGetter -> "Objects.toString(" + valueGetter + ", null)")
    .jsonDeserializationMethod("getNullable(nonNullReader -> new DateTimeRfc1123(nonNullReader.getString()))")
    .serializationMethodBase("writeString")
    .xmlElementDeserializationMethod("getNullableElement(DateTimeRfc1123::new)")
    .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, DateTimeRfc1123::new)")
    .build();

  public static final ClassType ANDROID_DATE_TIME_RFC_1123 = new ClassType.Builder(false)
    .packageName("com.azure.android.core.util").name("DateTimeRfc1123")
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
    .defaultValueExpressionConverter(defaultValueExpression -> "UUID.fromString(\"" + defaultValueExpression + "\")")
    .jsonToken("JsonToken.STRING")
    .serializationValueGetterModifier(valueGetter -> "Objects.toString(" + valueGetter + ", null)")
    .jsonDeserializationMethod("getNullable(nonNullReader -> UUID.fromString(nonNullReader.getString()))")
    .serializationMethodBase("writeString")
    .xmlElementDeserializationMethod("getNullableElement(UUID::fromString)")
    .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, UUID::fromString)")
    .build();

  public static final ClassType OBJECT = new ClassType.Builder(false)
    .knownClass(Object.class)
    .build();

  public static final ClassType TOKEN_CREDENTIAL = new ClassType.Builder(false).knownClass(TokenCredential.class)
    .build();

  public static final ClassType ANDROID_HTTP_RESPONSE_EXCEPTION = new ClassType.Builder(false)
    .packageName("com.azure.android.core.http.exception").name("HttpResponseException")
    .build();

  public static final ClassType UNIX_TIME_DATE_TIME = new ClassType.Builder(false)
    .defaultValueExpressionConverter(defaultValueExpression -> "OffsetDateTime.parse(\"" + defaultValueExpression + "\")")
    .jsonToken("JsonToken.STRING")
    .knownClass(OffsetDateTime.class)
    .serializationValueGetterModifier(valueGetter -> "Objects.toString(" + valueGetter + ", null)")
    .jsonDeserializationMethod("getNullable(nonNullReader -> OffsetDateTime.parse(nonNullReader.getString()))")
    .serializationMethodBase("writeString")
    .xmlElementDeserializationMethod("getNullableElement(OffsetDateTime::parse)")
    .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, OffsetDateTime::parse)")
    .build();

  public static final ClassType ANDROID_DATE_TIME = new ClassType.Builder(false)
    .packageName("org.threeten.bp").name("OffsetDateTime")
    .build();

  public static final ClassType UNIX_TIME_LONG = new ClassType.Builder(false)
    .prototypeAsLong()
    .build();

  public static final ClassType DURATION_LONG = new ClassType.Builder(false)
    .prototypeAsLong()
    .build();

  public static final ClassType DURATION_DOUBLE = new ClassType.Builder(false)
    .prototypeAsDouble()
    .build();

  public static final ClassType HTTP_PIPELINE = getClassTypeBuilder(HttpPipeline.class).build();

  public static final ClassType ANDROID_HTTP_PIPELINE = new ClassType.Builder(false)
    .packageName("com.azure.android.core.http").name("HttpPipeline")
    .build();

  public static final ClassType REST_PROXY = getClassTypeBuilder(RestProxy.class).build();

  public static final ClassType ANDROID_REST_PROXY = new ClassType.Builder(false)
    .packageName("com.azure.android.core.rest").name("RestProxy")
    .build();

  public static final ClassType SERIALIZER_ADAPTER = new ClassType.Builder(false).knownClass(SerializerAdapter.class)
    .build();
  public static final ClassType JSON_SERIALIZER = getClassTypeBuilder(JsonSerializer.class)
    .build();

  public static final ClassType ANDROID_JACKSON_SERDER = new ClassType.Builder(false)
    .packageName("com.azure.android.core.serde.jackson").name("JacksonSerder")
    .build();

  public static final ClassType FUNCTION = new ClassType.Builder(false).knownClass(Function.class).build();

  public static final ClassType BYTE_BUFFER = new ClassType.Builder(false).knownClass(ByteBuffer.class).build();

  public static final ClassType URL = new Builder(false)
    .defaultValueExpressionConverter(defaultValueExpression -> "new URL(\"" + defaultValueExpression + "\")")
    .knownClass(java.net.URL.class)
    .jsonToken("JsonToken.STRING")
    .serializationValueGetterModifier(valueGetter -> "Objects.toString(" + valueGetter + ", null)")
    .jsonDeserializationMethod("getNullable(nonNullReader -> new URL(nonNullReader.getString()))")
    .serializationMethodBase("writeString")
    .xmlElementDeserializationMethod("getNullableElement(urlString -> { try { return new URL(urlString); } catch (MalformedURLException e) { throw new XMLStreamException(e); } })")
    .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, URL::new)")
    .build();

  public static final ClassType STREAM_RESPONSE = new ClassType.Builder(false).knownClass(StreamResponse.class)
    .build();

  public static final ClassType INPUT_STREAM = new ClassType.Builder(false).knownClass(InputStream.class)
    .build();

  public static final ClassType CONTEXT = ClassType.getClassTypeBuilder(Context.class)
    .defaultValueExpressionConverter(epr -> "com.azure.core.util.Context.NONE")
    .build();

  public static final ClassType ANDROID_CONTEXT = new ClassType.Builder(false)
    .packageName("com.azure.android.core.util").name("Context")
    .build();

  public static final ClassType CLIENT_LOGGER = ClassType.getClassTypeBuilder(ClientLogger.class).build();
  public static final ClassType LOG_LEVEL = ClassType.getClassTypeBuilder(LogLevel.class).build();

  public static final ClassType AZURE_ENVIRONMENT = new ClassType.Builder(false)
    .packageName("com.azure.core.management").name("AzureEnvironment")
    .build();

  public static final ClassType HTTP_CLIENT = getClassTypeBuilder(HttpClient.class).build();

  public static final ClassType ANDROID_HTTP_CLIENT = new ClassType.Builder(false)
    .packageName("com.azure.android.core.http").name("HttpClient")
    .build();

  public static final ClassType HTTP_PIPELINE_POLICY = getClassTypeBuilder(HttpPipelinePolicy.class).build();

  public static final ClassType ANDROID_HTTP_PIPELINE_POLICY = new ClassType.Builder(false)
    .packageName("com.azure.android.core.http").name("HttpPipelinePolicy")
    .build();

  public static final ClassType HTTP_LOG_OPTIONS = getClassTypeBuilder(HttpLogOptions.class).build();

  public static final ClassType ANDROID_HTTP_LOG_OPTIONS = new ClassType.Builder(false)
    .packageName("com.azure.android.core.http.policy").name("HttpLogOptions")
    .build();

  public static final ClassType CONFIGURATION = getClassTypeBuilder(Configuration.class).build();

  public static final ClassType SERVICE_VERSION = new ClassType.Builder(false).knownClass(ServiceVersion.class)
    .build();

  public static final ClassType AZURE_KEY_CREDENTIAL = new ClassType.Builder(false)
    .knownClass(AzureKeyCredential.class)
    .build();

  public static final ClassType KEY_CREDENTIAL = getClassTypeBuilder(KeyCredential.class).build();

  public static final ClassType RETRY_POLICY = getClassTypeBuilder(RetryPolicy.class).build();
  public static final ClassType REDIRECT_POLICY = getClassTypeBuilder(RedirectPolicy.class).build();

  public static final ClassType RETRY_OPTIONS = getClassTypeBuilder(RetryOptions.class).build();

  public static final ClassType REDIRECT_OPTIONS = new ClassType.Builder(false)
    .packageName("io.clientcore.core.http.models").name("HttpRedirectOptions")
    .build();

  public static final ClassType ANDROID_RETRY_POLICY = new ClassType.Builder(false)
    .packageName("com.azure.android.core.http.policy").name("RetryPolicy")
    .build();

  public static final ClassType JSON_PATCH_DOCUMENT = new ClassType.Builder(false).knownClass(JsonPatchDocument.class)
    .jsonToken("JsonToken.START_OBJECT")
    .build();

  public static final ClassType BINARY_DATA = getClassTypeBuilder(BinaryData.class)
    .defaultValueExpressionConverter(defaultValueExpression -> "BinaryData.fromObject(\"" + defaultValueExpression + "\")")
    // When used as model property, serialization code will not use the "writeUntyped(nullableVar)",
    // because some backend would fail the request on "null" value.
    .serializationMethodBase("writeUntyped")
    .serializationValueGetterModifier(valueGetter -> valueGetter + " == null ? null : " + valueGetter + ".toObject(Object.class)")
    .jsonDeserializationMethod("getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped()))")
    .xmlElementDeserializationMethod("getNullableElement(BinaryData::fromObject)")
    .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, BinaryData::fromObject)")
    .build();

  public static final ClassType REQUEST_OPTIONS = getClassTypeBuilder(RequestOptions.class).build();
  public static final ClassType PROXY_OPTIONS = getClassTypeBuilder(ProxyOptions.class).build();
  public static final ClassType CLIENT_OPTIONS = getClassTypeBuilder(ClientOptions.class).build();
  public static final ClassType HTTP_REQUEST = getClassTypeBuilder(HttpRequest.class).build();
  public static final ClassType HTTP_HEADERS = getClassTypeBuilder(HttpHeaders.class).build();
  public static final ClassType HTTP_HEADER_NAME = getClassTypeBuilder(HttpHeaderName.class).build();

  // Java exception types
  public static final ClassType HTTP_RESPONSE_EXCEPTION = getClassTypeBuilder(HttpResponseException.class).build();
  public static final ClassType CLIENT_AUTHENTICATION_EXCEPTION = getClassTypeBuilder(ClientAuthenticationException.class)
    .build();
  public static final ClassType RESOURCE_EXISTS_EXCEPTION = getClassTypeBuilder(ResourceExistsException.class)
    .build();
  public static final ClassType RESOURCE_MODIFIED_EXCEPTION = getClassTypeBuilder(ResourceModifiedException.class)
    .build();
  public static final ClassType RESOURCE_NOT_FOUND_EXCEPTION = getClassTypeBuilder(ResourceNotFoundException.class)
    .build();
  public static final ClassType TOO_MANY_REDIRECTS_EXCEPTION = getClassTypeBuilder(TooManyRedirectsException.class)
    .build();
  public static final ClassType RESPONSE_ERROR = new Builder()
    .knownClass(ResponseError.class)
    .jsonToken("JsonToken.START_OBJECT")
    .build();
  public static final ClassType RESPONSE_INNER_ERROR = new Builder()
    .packageName("com.azure.core.models").name("ResponseInnerError")
    .jsonToken("JsonToken.START_OBJECT")
    .build();

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

  private ClassType(String packageKeyword, String name, List<String> implementationImports, XmsExtensions extensions,
                    Function<String, String> defaultValueExpressionConverter, boolean isSwaggerType, String jsonToken,
                    String serializationMethodBase, Function<String, String> serializationValueGetterModifier,
                    String jsonDeserializationMethod, String xmlAttributeDeserializationTemplate,
                    String xmlElementDeserializationMethod, boolean usedInXml) {
    this.fullName = packageKeyword + "." + name;
    this.packageName = packageKeyword;
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
    if (this == ClassType.DATE_TIME_RFC_1123 || this == ClassType.ANDROID_DATE_TIME_RFC_1123) {
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
    if (this == ClassType.DATE_TIME_RFC_1123 || this == ClassType.ANDROID_DATE_TIME_RFC_1123) {
      expression = "new DateTimeRfc1123(" + expression + ")";
    } else if (this == ClassType.UNIX_TIME_LONG) {
      expression = expression + ".toEpochSecond()";
    } else if (this == ClassType.BASE_64_URL) {
      expression = "Base64Url.encode(" + expression + ")";
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
      ? serializationValueGetterModifier.apply(valueGetter) : valueGetter;

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
      ? serializationValueGetterModifier.apply(valueGetter) : valueGetter;
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
        .defaultValueExpressionConverter(defaultValueExpression -> java.lang.String.valueOf(java.lang.Double.parseDouble(defaultValueExpression)) + 'D')
        .jsonToken("JsonToken.NUMBER")
        .serializationMethodBase("writeNumber")
        .jsonDeserializationMethod("getNullable(JsonReader::getDouble)")
        .xmlElementDeserializationMethod("getNullableElement(Double::parseDouble)")
        .xmlAttributeDeserializationTemplate("%s.getNullableAttribute(%s, %s, Double::parseDouble)");
    }

    public Builder knownClass(Class<?> clazz) {
      return packageName(clazz.getPackage().getName())
        .name(clazz.getSimpleName());
    }

    private Builder knownClass(String fullName) {
      int index = fullName.lastIndexOf(".");
      return packageName(fullName.substring(0, index))
        .name(fullName.substring(index + 1));
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
      String xmlAttributeDeserializationTemplate = isSwaggerType
        ? null : this.xmlAttributeDeserializationTemplate;
      String xmlElementDeserializationMethod = isSwaggerType ? null : this.xmlElementDeserializationMethod;

      return new ClassType(packageName, name, implementationImports, extensions, defaultValueExpressionConverter,
        isSwaggerType, jsonToken, serializationMethodBase, serializationValueGetterModifier,
        jsonDeserializationMethod, xmlAttributeDeserializationTemplate, xmlElementDeserializationMethod,
        usedInXml);
    }
  }

  static String xmlSerializationCallHelper(String writer, String method, String xmlName, String namespace,
                                           String value, boolean isAttribute, boolean nameIsVariable, boolean namespaceIsConstant) {
    String name = (xmlName == null) ? null
      : nameIsVariable ? xmlName : "\"" + xmlName + "\"";
    namespace = (namespace == null) ? null
      : namespaceIsConstant ? namespace : "\"" + namespace + "\"";

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
