// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.BinarySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ChoiceValue;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.KnownMediaType;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocol;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocols;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SealedChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import io.clientcore.core.http.models.HttpMethod;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

public class MethodUtilTests {
    @ParameterizedTest
    @CsvSource({
        "PUT, true",
        "PATCH, true",
        "DELETE, true",
        "POST, true",
        "GET, false",
        "HEAD, false",
        "OPTIONS, false",
        "TRACE, false" })
    public void onlySupportsRepeatabilityHeadersForMutatingMethods(HttpMethod method, boolean expected) {
        assertEquals(expected, MethodUtil.isHttpMethodSupportRepeatableRequestHeaders(method));
    }

    @ParameterizedTest
    @MethodSource("repeatabilityHeaders")
    public void requiresBothASupportedMethodAndARepeatabilityRequestId(HttpMethod method, List<String> headers,
        boolean expected) {
        ProxyMethod proxyMethod = new ProxyMethod.Builder().httpMethod(method).specialHeaders(headers).build();

        assertEquals(expected, MethodUtil.isMethodIncludeRepeatableRequestHeaders(proxyMethod));
    }

    private static Stream<Arguments> repeatabilityHeaders() {
        return Stream.of(Arguments.of(HttpMethod.POST, List.of(MethodUtil.REPEATABILITY_REQUEST_ID_HEADER), true),
            Arguments.of(HttpMethod.PUT,
                List.of(MethodUtil.REPEATABILITY_FIRST_SENT_HEADER, MethodUtil.REPEATABILITY_REQUEST_ID_HEADER), true),
            Arguments.of(HttpMethod.GET, List.of(MethodUtil.REPEATABILITY_REQUEST_ID_HEADER), false),
            Arguments.of(HttpMethod.POST, List.of(MethodUtil.REPEATABILITY_FIRST_SENT_HEADER), false),
            Arguments.of(HttpMethod.POST, List.of("Repeatability-Request-Id"), false),
            Arguments.of(null, List.of(MethodUtil.REPEATABILITY_REQUEST_ID_HEADER), false),
            Arguments.of(HttpMethod.POST, List.of(), false), Arguments.of(HttpMethod.POST, null, false));
    }

    @Test
    public void doesNotIncludeRepeatabilityHeadersForANullMethod() {
        assertFalse(MethodUtil.isMethodIncludeRepeatableRequestHeaders(null));
    }

    @ParameterizedTest
    @CsvSource({ "get, GET", "pAtCh, PATCH", "POST, POST", "delete, DELETE" })
    public void readsHttpMethodsWithoutCaseSensitivity(String method, HttpMethod expected) {
        Request request = request(KnownMediaType.JSON);
        request.getProtocol().getHttp().setMethod(method);

        assertEquals(expected, MethodUtil.getHttpMethod(operation(request)));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = { "unknown", " get " })
    public void returnsNullForUnrecognizedHttpMethods(String method) {
        Request request = request(KnownMediaType.JSON);
        request.getProtocol().getHttp().setMethod(method);

        assertNull(MethodUtil.getHttpMethod(operation(request)));
    }

    @Test
    public void readsTheHttpMethodFromTheFirstRequest() {
        Request first = request(KnownMediaType.JSON);
        first.getProtocol().getHttp().setMethod("GET");
        Request second = request(KnownMediaType.JSON);
        second.getProtocol().getHttp().setMethod("POST");

        assertEquals(HttpMethod.GET, MethodUtil.getHttpMethod(operation(first, second)));
    }

    @Test
    public void returnsNullWhenHttpMethodMetadataIsMissing() {
        assertNull(MethodUtil.getHttpMethod(new Operation()));
        assertNull(MethodUtil.getHttpMethod(operation()));
        assertNull(MethodUtil.getHttpMethod(operation(new Request())));
        Request request = new Request();
        request.setProtocol(new Protocols());
        assertNull(MethodUtil.getHttpMethod(operation(request)));
    }

    @ParameterizedTest
    @CsvSource({ "true, true", "true, false", "false, true", "false, false" })
    public void mergesBinaryRequestsAndPlacesContentTypeBeforeContentLengthOrTheBody(boolean required,
        boolean includeContentLength) {
        Request json = request(KnownMediaType.JSON, "application/json");
        Request binary = request(KnownMediaType.BINARY, "application/octet-stream");
        Request otherBinary = request(KnownMediaType.BINARY, "application/pdf");
        Parameter marker = parameter("marker", RequestParameterLocation.QUERY);
        Parameter body = binaryBody(required);
        Parameter contentLength = parameter("Content-Length", RequestParameterLocation.HEADER);
        binary.getParameters().add(marker);
        binary.getSignatureParameters().add(marker);
        if (includeContentLength) {
            binary.getParameters().add(contentLength);
            binary.getSignatureParameters().add(contentLength);
        }
        binary.getParameters().add(body);
        if (required) {
            binary.getSignatureParameters().add(body);
        }
        Operation operation = operation(json, binary, otherBinary);
        List<Request> originalRequests = operation.getRequests();

        assertSame(binary, MethodUtil.tryMergeBinaryRequestsAndUpdateOperation(originalRequests, operation));

        assertEquals(List.of(binary), operation.getRequests());
        assertEquals(List.of(json, binary, otherBinary), originalRequests);
        Parameter contentType = binary.getParameters().get(1);
        List<Parameter> expectedParameters = new ArrayList<>(List.of(marker, contentType));
        if (includeContentLength) {
            expectedParameters.add(contentLength);
        }
        expectedParameters.add(body);
        assertEquals(expectedParameters, binary.getParameters());
        List<Parameter> expectedSignature = new ArrayList<>(expectedParameters);
        if (!required) {
            expectedSignature.remove(contentType);
            expectedSignature.remove(body);
        }
        assertEquals(expectedSignature, binary.getSignatureParameters());
        assertSame(operation, contentType.getOperation());
        assertEquals(required, contentType.isRequired());
        assertEquals(Parameter.ImplementationLocation.METHOD, contentType.getImplementation());
        assertEquals(RequestParameterLocation.HEADER, contentType.getProtocol().getHttp().getIn());
        assertEquals("contentType", contentType.getLanguage().getJava().getName());
        assertEquals("Content-Type", contentType.getLanguage().getJava().getSerializedName());
        assertEquals("The content type", contentType.getLanguage().getDefault().getDescription());
        SealedChoiceSchema choices = assertInstanceOf(SealedChoiceSchema.class, contentType.getSchema());
        assertEquals(Schema.AllSchemaTypes.SEALED_CHOICE, choices.getType());
        assertEquals(Schema.AllSchemaTypes.STRING, choices.getChoiceType().getType());
        assertEquals(List.of("application/json", "application/octet-stream", "application/pdf"),
            choices.getChoices().stream().map(ChoiceValue::getValue).collect(Collectors.toList()));
        assertTrue(json.getParameters().isEmpty());
        assertTrue(otherBinary.getParameters().isEmpty());
    }

    @Test
    public void preservesRequestsWhenThereIsNoBinaryAlternative() {
        Request first = request(KnownMediaType.JSON, "application/json");
        Request second = request(KnownMediaType.JSON, "application/xml");
        Operation operation = operation(first, second);
        List<Request> originalRequests = operation.getRequests();

        assertSame(first, MethodUtil.tryMergeBinaryRequestsAndUpdateOperation(originalRequests, operation));
        assertSame(originalRequests, operation.getRequests());
        assertEquals(List.of(first, second), operation.getRequests());
        assertTrue(first.getParameters().isEmpty());
    }

    @Test
    public void doesNotAddContentTypeForASingleMediaType() {
        Request binary = request(KnownMediaType.BINARY, "application/octet-stream");
        Parameter body = binaryBody(true);
        binary.getParameters().add(body);
        binary.getSignatureParameters().add(body);
        Operation operation = operation(binary);

        MethodUtil.tryMergeBinaryRequestsAndUpdateOperation(operation.getRequests(), operation);

        assertEquals(List.of(body), binary.getParameters());
        assertEquals(List.of(body), binary.getSignatureParameters());
    }

    @ParameterizedTest
    @ValueSource(strings = { "Content-Type", "content-type", "CONTENT-TYPE" })
    public void preservesAnExistingContentTypeParameter(String serializedName) {
        Request binary = request(KnownMediaType.BINARY, "application/octet-stream");
        Parameter contentType = parameter(serializedName, RequestParameterLocation.HEADER);
        Parameter body = binaryBody(true);
        binary.getParameters().addAll(List.of(contentType, body));
        binary.getSignatureParameters().addAll(List.of(contentType, body));
        Operation operation = operation(request(KnownMediaType.JSON, "application/json"), binary);

        MethodUtil.tryMergeBinaryRequestsAndUpdateOperation(operation.getRequests(), operation);

        assertEquals(List.of(contentType, body), binary.getParameters());
        assertEquals(List.of(contentType, body), binary.getSignatureParameters());
        assertInstanceOf(StringSchema.class, contentType.getSchema());
    }

    @Test
    public void countsDistinctMediaTypesAndIgnoresMissingMediaTypes() {
        Request missing = request(KnownMediaType.JSON);
        missing.getProtocol().getHttp().setMediaTypes(null);

        assertEquals(3,
            MethodUtil.getContentTypeCount(List.of(request(KnownMediaType.JSON, "application/json", "text/json"),
                request(KnownMediaType.BINARY, "application/json", "application/octet-stream"),
                request(KnownMediaType.JSON), missing)));
        assertEquals(0, MethodUtil.getContentTypeCount(List.of()));
    }

    @Test
    public void createsOptionalContentTypeWhenThereIsNoBinaryBody() {
        Request request = request(KnownMediaType.JSON, "application/json");
        Operation operation = operation(request);

        Parameter contentType = MethodUtil.createContentTypeParameter(request, operation);

        assertFalse(contentType.isRequired());
        assertSame(operation, contentType.getOperation());
        assertEquals("Content-Type", contentType.getLanguage().getJava().getSerializedName());
    }

    @Test
    public void checksRequestContentTypeWithoutRequiringOptionalProtocolMetadata() {
        assertTrue(
            MethodUtil.isContentTypeInRequest(request(KnownMediaType.JSON, "application/json"), "application/json"));
        assertFalse(MethodUtil.isContentTypeInRequest(request(KnownMediaType.JSON, "application/json"), "text/plain"));
        assertFalse(MethodUtil.isContentTypeInRequest(new Request(), "application/json"));
        Request request = new Request();
        request.setProtocol(new Protocols());
        assertFalse(MethodUtil.isContentTypeInRequest(request, "application/json"));
        request.setProtocol(protocol(new Protocol()));
        assertFalse(MethodUtil.isContentTypeInRequest(request, "application/json"));
    }

    @ParameterizedTest
    @CsvSource({
        "QUERY, maxpagesize, count, true",
        "QUERY, x-max-page-size, maxPageSize, true",
        "QUERY, top, top, false",
        "QUERY, MaxPageSize, count, false",
        "HEADER, maxpagesize, maxPageSize, false",
        "BODY, maxpagesize, maxPageSize, false" })
    public void findsMaxPageSizeOnlyInQueryParameters(RequestParameterLocation location, String serializedName,
        String name, boolean expected) {
        ProxyMethodParameter parameter = new ProxyMethodParameter.Builder().name(name)
            .requestParameterName(serializedName)
            .requestParameterLocation(location)
            .wireType(ClassType.STRING)
            .build();
        ProxyMethod method = new ProxyMethod.Builder().parameters(List.of()).allParameters(List.of(parameter)).build();

        assertEquals(expected ? Optional.of(serializedName) : Optional.empty(),
            MethodUtil.serializedNameOfMaxPageSizeParameter(method));
    }

    @Test
    public void usesTheFirstMatchingMaxPageSizeParameterFromAllParameters() {
        ProxyMethodParameter first = new ProxyMethodParameter.Builder().name("maxPageSize")
            .requestParameterName("x-page-size")
            .requestParameterLocation(RequestParameterLocation.QUERY)
            .build();
        ProxyMethodParameter second = new ProxyMethodParameter.Builder().name("limit")
            .requestParameterName("maxpagesize")
            .requestParameterLocation(RequestParameterLocation.QUERY)
            .build();
        ProxyMethod method
            = new ProxyMethod.Builder().parameters(List.of()).allParameters(List.of(first, second)).build();

        assertEquals(Optional.of("x-page-size"), MethodUtil.serializedNameOfMaxPageSizeParameter(method));
    }

    @ParameterizedTest
    @NullAndEmptySource
    public void suppliesADefaultDescriptionForUndocumentedParameters(String description) {
        ClientMethodParameter parameter = new ClientMethodParameter.Builder().name("widget")
            .wireType(ClassType.STRING)
            .description(description)
            .build();

        assertEquals("The widget parameter", MethodUtil.methodParameterDescriptionOrDefault(parameter));
    }

    @Test
    public void preservesAnExplicitParameterDescription() {
        ClientMethodParameter parameter = new ClientMethodParameter.Builder().name("widget")
            .wireType(ClassType.STRING)
            .description("The widget to create.")
            .build();

        assertEquals("The widget to create.", MethodUtil.methodParameterDescriptionOrDefault(parameter));
    }

    private static Request request(KnownMediaType mediaType, String... contentTypes) {
        Request request = new Request();
        Protocol http = new Protocol();
        http.setKnownMediaType(mediaType);
        http.setMediaTypes(new ArrayList<>(Arrays.asList(contentTypes)));
        request.setProtocol(protocol(http));
        return request;
    }

    private static Protocols protocol(Protocol http) {
        Protocols protocols = new Protocols();
        protocols.setHttp(http);
        return protocols;
    }

    private static Operation operation(Request... requests) {
        Operation operation = new Operation();
        operation.setRequests(new ArrayList<>(Arrays.asList(requests)));
        return operation;
    }

    private static Parameter binaryBody(boolean required) {
        Parameter body = parameter("body", RequestParameterLocation.BODY);
        BinarySchema schema = new BinarySchema();
        schema.setType(Schema.AllSchemaTypes.BINARY);
        body.setSchema(schema);
        body.setRequired(required);
        return body;
    }

    private static Parameter parameter(String serializedName, RequestParameterLocation location) {
        Parameter parameter = new Parameter();
        StringSchema schema = new StringSchema();
        schema.setType(Schema.AllSchemaTypes.STRING);
        parameter.setSchema(schema);
        parameter.setImplementation(Parameter.ImplementationLocation.METHOD);
        Protocol http = new Protocol();
        http.setIn(location);
        parameter.setProtocol(protocol(http));
        Language language = new Language();
        language.setName(serializedName);
        language.setSerializedName(serializedName);
        Languages languages = new Languages();
        languages.setJava(language);
        languages.setDefault(language);
        parameter.setLanguage(languages);
        return parameter;
    }
}
