// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.MockUnitJavagen;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConvenienceApi;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Property;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocol;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocols;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Relations;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Response;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel.XmsExtensions;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings.SyncMethodsGeneration;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Versioning;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.util.SseUtil;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.utils.IOExceptionCheckedFunction;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

@Isolated
public class ClientMethodMapperTests {
    @Test
    public void preservesOrdinaryPackageRootParameterAndTransformationNames() {
        useSseSettings(false);
        try {
            Operation operation = sseOperation();
            operation.setSseMetadata(null);
            for (String name : List.of("com", "comParam", "reactor", "reactorParam")) {
                Parameter parameter = optionalQueryParameter(name, List.of());
                parameter.setOperation(operation);
                Assertions.assertEquals(name, ClientParameterMapper.getInstance().map(parameter, false).getName());
                Assertions.assertEquals(name, ClientParameterMapper.getInstance().map(parameter, true).getName());
                Assertions.assertEquals(name,
                    ProxyParameterMapper.getInstance().map(parameter).getParameterReference());
                Assertions.assertEquals(name,
                    CustomClientParameterMapper.getInstance().map(parameter, false).getName());
                Assertions.assertEquals(name,
                    CustomProxyParameterMapper.getInstance().map(parameter).getParameterReference());
                parameter.setFlattened(true);
                Request request = new Request();
                request.setParameters(List.of(parameter));
                Assertions.assertEquals(name,
                    new ParametersTransformationProcessor(false).process(request)
                        .asStream()
                        .findFirst()
                        .orElseThrow()
                        .getOutParameter()
                        .getName());
            }
        } finally {
            resetJavaSettings();
        }
    }

    @Test
    public void preservesOrdinaryPackageRootNamesForSseParameterMappings() {
        useSseSettings(false);
        try {
            Operation operation = sseOperation();
            for (String name : List.of("com", "comParam", "reactor", "reactorParam")) {
                Parameter parameter = optionalQueryParameter(name, List.of());
                parameter.setOperation(operation);
                String expected = name;
                Assertions.assertEquals(expected, ClientParameterMapper.getInstance().map(parameter, false).getName());
                Assertions.assertEquals(expected, ClientParameterMapper.getInstance().map(parameter, true).getName());
                Assertions.assertEquals(expected, ProxyParameterMapper.getInstance().map(parameter).getName());
                Assertions.assertEquals(expected,
                    ProxyParameterMapper.getInstance().map(parameter).getParameterReference());
                Assertions.assertEquals(expected,
                    CustomClientParameterMapper.getInstance().map(parameter, false).getName());
                Assertions.assertEquals(expected,
                    CustomProxyParameterMapper.getInstance().map(parameter).getParameterReference());
                parameter.setFlattened(true);
                Request request = new Request();
                request.setParameters(List.of(parameter));
                Assertions.assertEquals(expected,
                    new ParametersTransformationProcessor(false).process(request)
                        .asStream()
                        .findFirst()
                        .orElseThrow()
                        .getOutParameter()
                        .getName());
            }
        } finally {
            resetJavaSettings();
        }
    }

    @Test
    public void preservesInternalSseWrapperVisibility() {
        useSseSettings(false);
        try {
            for (boolean internal : List.of(false, true)) {
                Operation operation = sseOperation();
                operation.setInternalApi(internal);
                SseMetadata metadata = operation.getSseMetadata();

                var mapper = ClientMethodMapper.getInstance();
                List<ClientMethod> sseMethods = mapper.map(operation, false)
                    .stream()
                    .filter(method -> method.getType() == ClientMethodType.SseSync
                        || method.getType() == ClientMethodType.SseAsync)
                    .collect(Collectors.toList());
                Assertions.assertEquals(java.util.Set.of(ClientMethodType.SseSync, ClientMethodType.SseAsync),
                    sseMethods.stream().map(ClientMethod::getType).collect(Collectors.toSet()));
                sseMethods.forEach(
                    method -> Assertions.assertEquals(internal ? JavaVisibility.PackagePrivate : JavaVisibility.Public,
                        method.getMethodVisibilityInWrapperClient()));
                sseMethods.forEach(
                    method -> Assertions.assertTrue(method.getReturnValue().getType().toString().contains("TestEvent2"),
                        method.getReturnValue().getType().toString()));
                mapper.map(operation, false)
                    .stream()
                    .filter(method -> method.getType() == ClientMethodType.SseSync
                        || method.getType() == ClientMethodType.SseAsync)
                    .forEach(method -> {
                        Assertions.assertEquals(Mappers.getObjectMapper().map(metadata.getBaseSchema()),
                            method.getSseMetadata().getEventType());
                        Assertions.assertEquals(SseUtil.getSerializerType(method.getSseMetadata().getEventType()),
                            method.getSseMetadata().getSerializerType());
                        Assertions.assertEquals(SseUtil.getTerminalEventNames(metadata),
                            method.getSseMetadata().getTerminalEventNames());
                    });

                Operation protocolOperation = sseOperation();
                protocolOperation.getResponses().get(0).setBinary(true);
                protocolOperation.getResponses().get(0).setSchema(null);
                List<ClientMethod> protocolMethods = mapper.map(protocolOperation, true);
                Assertions.assertEquals(
                    java.util.Set.of(ClientMethodType.SimpleSyncRestResponse, ClientMethodType.SimpleAsyncRestResponse),
                    protocolMethods.stream().map(ClientMethod::getType).collect(Collectors.toSet()));
                Assertions.assertTrue(protocolMethods.stream().allMatch(method -> method.getSseMetadata() == null));
                protocolMethods.forEach(
                    method -> Assertions.assertTrue(method.getReturnValue().getType().toString().contains("BinaryData"),
                        method.getReturnValue().getType().toString()));
            }
        } finally {
            resetJavaSettings();
        }
    }

    @Test
    public void sseSyncOnlyModeDoesNotGenerateAsyncMethods() {
        Assertions.assertFalse(ClientMethodMapper.shouldGenerateAsyncSseMethod(false, SyncMethodsGeneration.SYNC_ONLY));
        Assertions
            .assertTrue(ClientMethodMapper.shouldGenerateSyncSseMethod(false, SyncMethodsGeneration.SYNC_ONLY, false));
    }

    @Test
    public void sseSyncOverAsyncGeneratesBothMethodKinds() {
        Assertions.assertTrue(ClientMethodMapper.shouldGenerateAsyncSseMethod(false, SyncMethodsGeneration.ALL));
        Assertions.assertTrue(ClientMethodMapper.shouldGenerateSyncSseMethod(false, SyncMethodsGeneration.ALL, false));
    }

    @Test
    public void createsHistoricalSseOverloadsForVersionedParameters() {
        useSseSettings(true);
        try {
            Operation operation = versionedSseOperation();
            List<ClientMethod> methods = ClientMethodMapper.getInstance()
                .map(operation, false)
                .stream()
                .filter(method -> method.getType() == ClientMethodType.SseSync
                    || method.getType() == ClientMethodType.SseAsync)
                .collect(Collectors.toList());

            for (ClientMethodType methodType : List.of(ClientMethodType.SseSync, ClientMethodType.SseAsync)) {
                List<ClientMethod> overloads
                    = methods.stream().filter(method -> method.getType() == methodType).collect(Collectors.toList());
                Assertions.assertEquals(3, overloads.size(),
                    () -> methodType + ": "
                        + overloads.stream()
                            .map(method -> method.getParametersDeclaration() + " [requiredOnly="
                                + method.getOnlyRequiredParameters() + "]")
                            .collect(Collectors.joining(", ")));
                Assertions.assertEquals(List.of(List.of(), List.of("existing"), List.of("existing", "added")), overloads
                    .stream()
                    .map(ClientMethod::getMethodInputParameters)
                    .map(parameters -> parameters.stream().map(MethodParameter::getName).collect(Collectors.toList()))
                    .sorted((left, right) -> Integer.compare(left.size(), right.size()))
                    .collect(Collectors.toList()), methodType.toString());

                ClientMethod historical = overloads.stream()
                    .filter(method -> method.getMethodInputParameters().size() == 1)
                    .findFirst()
                    .orElseThrow();
                ClientMethod full = overloads.stream()
                    .filter(method -> method.getMethodInputParameters().size() == 2)
                    .findFirst()
                    .orElseThrow();
                Assertions.assertSame(full, historical.getOverloadedClientMethod());
                Assertions.assertSame(full.getSseMetadata(), historical.getSseMetadata());
                Assertions.assertEquals(full.getReturnValue().getType(), historical.getReturnValue().getType());
                Assertions.assertEquals(full.getName(), historical.getName());
                Assertions.assertEquals(full.getMethodVisibility(), historical.getMethodVisibility());
                Assertions.assertEquals(full.getMethodVisibilityInWrapperClient(),
                    historical.getMethodVisibilityInWrapperClient());
                Assertions.assertEquals(List.of("v2"),
                    full.getMethodInputParameters()
                        .stream()
                        .filter(parameter -> parameter.getName().equals("added"))
                        .findFirst()
                        .orElseThrow()
                        .getVersioning()
                        .getAdded());
            }
        } finally {
            resetJavaSettings();
        }
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = "lite")
    public void mapsSseAsOrdinaryBinaryMethodsOutsideDataPlane(String fluent) {
        useSseSettings(false, false, fluent);
        try {
            Operation operation = sseOperation();
            operation.getResponses().get(0).setBinary(true);
            operation.getResponses().get(0).setSchema(null);

            List<ClientMethod> methods = ClientMethodMapper.getInstance().map(operation);
            Assertions.assertEquals(
                java.util.Set.of(ClientMethodType.SimpleSync, ClientMethodType.SimpleAsync,
                    ClientMethodType.SimpleSyncRestResponse, ClientMethodType.SimpleAsyncRestResponse),
                methods.stream().map(ClientMethod::getType).collect(Collectors.toSet()));
            Assertions.assertTrue(methods.stream()
                .noneMatch(method -> method.getType() == ClientMethodType.SseSync
                    || method.getType() == ClientMethodType.SseAsync));
            Assertions.assertTrue(methods.stream().allMatch(method -> method.getSseMetadata() == null));
            methods.forEach(method -> {
                String returnType = method.getReturnValue().getType().toString();
                Assertions.assertTrue(returnType.contains("BinaryData"), returnType);
                Assertions.assertFalse(returnType.contains("TestEvent"), returnType);
                Assertions.assertFalse(returnType.contains("ServerSentEventStreamHelper"), returnType);
            });
        } finally {
            resetJavaSettings();
        }
    }

    @Test
    public void testConvenienceResponseReplacement() {
        Operation operation = operationWithNoDesc();
        operation.getRequests().get(0).getProtocol().getHttp().setMethod(HttpMethod.GET.name());
        StringSchema schema = new StringSchema();
        schema.setType(Schema.AllSchemaTypes.STRING);
        operation.getResponses().get(0).setSchema(schema);
        ConvenienceApi convenienceApi = new ConvenienceApi();
        operation.setConvenienceApi(convenienceApi);
        Response response = new Response();
        convenienceApi.setResponse(response);

        Assertions.assertEquals(PrimitiveType.VOID,
            ClientMethodsReturnDescription.create(operation, false, true).getSyncReturnType());
        Assertions.assertEquals(ClassType.BINARY_DATA,
            ClientMethodsReturnDescription.create(operation, true, true).getSyncReturnType());

        response.setBinary(true);
        Assertions.assertEquals(ClassType.BINARY_DATA,
            ClientMethodsReturnDescription.create(operation, false, true).getSyncReturnType());
        Assertions.assertEquals(ClassType.BINARY_DATA,
            ClientMethodsReturnDescription.create(operation, true, true).getSyncReturnType());

        response.setBinary(false);
        response.setSchema(schema);
        Assertions.assertEquals(ClassType.STRING,
            ClientMethodsReturnDescription.create(operation, false, true).getSyncReturnType());

        convenienceApi.setResponse(null);
        Assertions.assertEquals(ClassType.STRING,
            ClientMethodsReturnDescription.create(operation, false, true).getSyncReturnType());
    }

    @Test
    public void testOverloadedSignatures() {
        List<ClientMethodParameter> parameters = new ArrayList<>();

        parameters
            .add(new ClientMethodParameter.Builder().name("param0").wireType(ClassType.STRING).required(true).build());

        parameters.add(new ClientMethodParameter.Builder().name("param1").wireType(ClassType.STRING).build());

        parameters.add(new ClientMethodParameter.Builder().name("param2")
            .wireType(ClassType.STRING)
            .versioning(new Versioning.Builder().added(Arrays.asList("v1", "v2", "v3", "v4", "v5")).build())
            .build());

        parameters.add(new ClientMethodParameter.Builder().name("param3")
            .wireType(ClassType.STRING)
            .versioning(new Versioning.Builder().added(Arrays.asList("v2", "v3", "v4", "v5")).build())
            .build());

        parameters.add(new ClientMethodParameter.Builder().name("param4")
            .wireType(ClassType.STRING)
            .versioning(new Versioning.Builder().added(Arrays.asList("v3", "v4", "v5")).build())
            .build());

        parameters.add(new ClientMethodParameter.Builder().name("param5")
            .wireType(ClassType.STRING)
            .versioning(new Versioning.Builder().added(Arrays.asList("v5")).build())
            .build());

        List<List<ClientMethodParameter>> signatures = ClientMethodMapper.findOverloadedSignatures(parameters);
        Assertions.assertEquals(4, signatures.size());
        // API for required-only would be signature of "param0"
        // API for no added (aka "v0")
        Assertions.assertEquals(Arrays.asList("param0", "param1"),
            signatures.get(0).stream().map(MethodParameter::getName).collect(Collectors.toList()));
        // API for v1
        Assertions.assertEquals(Arrays.asList("param0", "param1", "param2"),
            signatures.get(1).stream().map(MethodParameter::getName).collect(Collectors.toList()));
        // API for v2
        Assertions.assertEquals(Arrays.asList("param0", "param1", "param2", "param3"),
            signatures.get(2).stream().map(MethodParameter::getName).collect(Collectors.toList()));
        // API for v3
        Assertions.assertEquals(Arrays.asList("param0", "param1", "param2", "param3", "param4"),
            signatures.get(3).stream().map(MethodParameter::getName).collect(Collectors.toList()));
        // API for v4 be same as v3
        // API for v5 would be same as full parameters
    }

    @Test
    public void returnTypeDescTest() {
        Operation operation;
        IType returnType;
        IType baseType;
        String description;
        String operationDesc;
        String responseSchemaDesc;
        String expectedDescription;

        // description on operation
        // Mono
        operationDesc = "desc from operation";
        responseSchemaDesc = "desc from response schema";
        operation = operationWithDescOnOperationAndResponseSchema(operationDesc, responseSchemaDesc);
        expectedDescription = String.format("%s on successful completion of {@link Mono}", operationDesc);

        // Mono<Void>
        baseType = PrimitiveType.VOID;
        returnType = GenericType.mono(baseType);
        description = ClientMethodsReturnDescription.returnTypeJavaDoc(operation, returnType, baseType);
        Assertions.assertEquals(expectedDescription, description);        // Mono<Boolean>
        baseType = PrimitiveType.BOOLEAN;
        returnType = GenericType.mono(baseType);
        description = ClientMethodsReturnDescription.returnTypeJavaDoc(operation, returnType, baseType);
        Assertions.assertEquals(expectedDescription, description);
        // Response
        operation = operationWithDescOnOperationAndResponseSchema(operationDesc, responseSchemaDesc);
        expectedDescription = String.format("%s along with {@link Response}", operationDesc);
        // Response<Void>
        baseType = PrimitiveType.VOID;
        returnType = GenericType.response(baseType);
        description = ClientMethodsReturnDescription.returnTypeJavaDoc(operation, returnType, baseType);
        Assertions.assertEquals(expectedDescription, description);        // Response<Boolean>
        baseType = PrimitiveType.BOOLEAN;
        returnType = GenericType.response(baseType);
        description = ClientMethodsReturnDescription.returnTypeJavaDoc(operation, returnType, baseType);
        Assertions.assertEquals(expectedDescription, description);

        // description on schema
        // Mono
        operation = operationWithDescOnResponseSchema(responseSchemaDesc);
        expectedDescription = String.format("%s on successful completion of {@link Mono}", responseSchemaDesc);
        // Mono<Void>
        baseType = PrimitiveType.VOID;
        returnType = GenericType.mono(baseType);
        description = ClientMethodsReturnDescription.returnTypeJavaDoc(operation, returnType, baseType);
        // Mono<Boolean>
        Assertions.assertEquals(expectedDescription, description);
        baseType = PrimitiveType.BOOLEAN;
        returnType = GenericType.mono(baseType);
        description = ClientMethodsReturnDescription.returnTypeJavaDoc(operation, returnType, baseType);
        // Mono<T>
        Assertions.assertEquals(expectedDescription, description);
        baseType = GenericType.response(ClassType.STRING);
        returnType = GenericType.mono(baseType);
        description = ClientMethodsReturnDescription.returnTypeJavaDoc(operation, returnType, baseType);
        expectedDescription
            = "desc from response schema along with {@link Response} on successful completion of {@link Mono}";
        Assertions.assertEquals(expectedDescription, description);

        // Response
        operation = operationWithDescOnResponseSchema(responseSchemaDesc);
        expectedDescription = String.format("%s along with {@link Response}", responseSchemaDesc);
        // Response<Void>
        baseType = PrimitiveType.VOID;
        returnType = GenericType.response(baseType);
        description = ClientMethodsReturnDescription.returnTypeJavaDoc(operation, returnType, baseType);
        Assertions.assertEquals(expectedDescription, description);
        // Response<Boolean>
        baseType = PrimitiveType.BOOLEAN;
        returnType = GenericType.response(baseType);
        description = ClientMethodsReturnDescription.returnTypeJavaDoc(operation, returnType, baseType);
        Assertions.assertEquals(expectedDescription, description);
        // Response<T>
        baseType = GenericType.mono(ClassType.STRING);
        returnType = GenericType.response(baseType);
        description = ClientMethodsReturnDescription.returnTypeJavaDoc(operation, returnType, baseType);
        Assertions.assertEquals(expectedDescription, description);

        // no description on either operation or schema
        // Mono
        operation = operationWithNoDesc();
        // Mono<Void>
        baseType = PrimitiveType.VOID;
        returnType = GenericType.mono(baseType);
        description = ClientMethodsReturnDescription.returnTypeJavaDoc(operation, returnType, baseType);
        expectedDescription = "A {@link Mono} that completes when a successful response is received";
        Assertions.assertEquals(expectedDescription, description);
        // Mono<Boolean>
        baseType = PrimitiveType.BOOLEAN;
        returnType = GenericType.mono(baseType);
        description = ClientMethodsReturnDescription.returnTypeJavaDoc(operation, returnType, baseType);
        expectedDescription = String.format("%s on successful completion of {@link Mono}", "whether resource exists");
        Assertions.assertEquals(expectedDescription, description);
        // Mono<Response>
        baseType = GenericType.response(ClassType.STRING);
        returnType = GenericType.mono(baseType);
        description = ClientMethodsReturnDescription.returnTypeJavaDoc(operation, returnType, baseType);
        expectedDescription = "the response body along with {@link Response} on successful completion of {@link Mono}";
        Assertions.assertEquals(expectedDescription, description);

        // Response
        operation = operationWithNoDesc();
        // Response<Void>
        baseType = PrimitiveType.VOID;
        returnType = GenericType.response(baseType);
        description = ClientMethodsReturnDescription.returnTypeJavaDoc(operation, returnType, baseType);
        expectedDescription = "the {@link Response}";
        Assertions.assertEquals(expectedDescription, description);
        // Response<Boolean>
        baseType = PrimitiveType.BOOLEAN;
        returnType = GenericType.response(baseType);
        description = ClientMethodsReturnDescription.returnTypeJavaDoc(operation, returnType, baseType);
        expectedDescription = String.format("%s along with {@link Response}", "whether resource exists");
        Assertions.assertEquals(expectedDescription, description);
        // Response<T>
        baseType = ClassType.STRING;
        returnType = GenericType.response(baseType);
        description = ClientMethodsReturnDescription.returnTypeJavaDoc(operation, returnType, baseType);
        expectedDescription = "the response body along with {@link Response}";
        Assertions.assertEquals(expectedDescription, description);
    }

    private Operation operationWithNoDesc() {
        return operationWithDescOnOperationAndResponseSchema(null, null);
    }

    private Operation versionedSseOperation() {
        Operation operation = sseOperation();
        Request request = operation.getRequests().get(0);
        Parameter existing = optionalQueryParameter("existing", null);
        Parameter added = optionalQueryParameter("added", List.of("v2"));
        existing.setOperation(operation);
        added.setOperation(operation);
        request.setParameters(List.of(existing, added));
        request.setSignatureParameters(List.of(existing, added));
        return operation;
    }

    private Operation sseOperation() {
        Operation operation = operationWithNoDesc();
        operation.getLanguage().getDefault().setName("read");
        operation.getLanguage().setJava(operation.getLanguage().getDefault());
        OperationGroup group = new OperationGroup();
        Languages groupLanguages = new Languages();
        Language groupLanguage = new Language();
        groupLanguage.setName("");
        groupLanguages.setDefault(groupLanguage);
        groupLanguages.setJava(groupLanguage);
        group.setLanguage(groupLanguages);
        operation.setOperationGroup(group);

        Request request = operation.getRequests().get(0);
        request.setLanguage(operation.getLanguage());
        request.getProtocol().getHttp().setMethod("GET");
        request.getProtocol().getHttp().setUri("https://example.org");
        request.getProtocol().getHttp().setPath("/stream");
        Response response = operation.getResponses().get(0);
        Protocol http = new Protocol();
        http.setStatusCodes(List.of("200"));
        Protocols protocols = new Protocols();
        protocols.setHttp(http);
        response.setProtocol(protocols);
        StringSchema payload = new StringSchema();
        payload.setType(Schema.AllSchemaTypes.STRING);
        response.setSchema(payload);
        ObjectSchema baseSchema = sseObjectSchema("TestEvent2");
        baseSchema.setProperties(List.of(sseProperty("eventName", stringSchema())));
        ObjectSchema eventSchema = sseObjectSchema("TestMessageStreamEvent3");
        Relations parents = new Relations();
        parents.setImmediate(List.of(baseSchema));
        parents.setAll(List.of(baseSchema));
        eventSchema.setParents(parents);
        eventSchema.setProperties(List.of(sseProperty("value", payload)));
        SseEventMetadata event = new SseEventMetadata();
        event.setName("message");
        event.setEventSchema(eventSchema);
        SseMetadata metadata = new SseMetadata();
        metadata.setSseStreamId("TestEvents");
        metadata.setStreamName("TestEvents");
        metadata.setBaseSchema(baseSchema);
        metadata.setEvents(List.of(event));
        operation.setSseMetadata(metadata);
        return operation;
    }

    private static ObjectSchema sseObjectSchema(String name) {
        Language language = new Language();
        language.setName(name);
        language.setNamespace("com.azure.mock");
        language.setDescription(name);
        Languages languages = new Languages();
        languages.setDefault(language);
        languages.setJava(language);
        ObjectSchema schema = new ObjectSchema();
        schema.setType(Schema.AllSchemaTypes.OBJECT);
        schema.setLanguage(languages);
        return schema;
    }

    private static Property sseProperty(String name, Schema schema) {
        Language language = new Language();
        language.setName(name);
        language.setDescription(name);
        Languages languages = new Languages();
        languages.setDefault(language);
        languages.setJava(language);
        Property property = new Property();
        property.setLanguage(languages);
        property.setSerializedName(name);
        property.setRequired(true);
        property.setReadOnly(true);
        property.setSchema(schema);
        return property;
    }

    private static StringSchema stringSchema() {
        StringSchema schema = new StringSchema();
        schema.setType(Schema.AllSchemaTypes.STRING);
        return schema;
    }

    private static Parameter optionalQueryParameter(String name, List<String> addedVersions) {
        Parameter parameter = new Parameter();
        StringSchema schema = new StringSchema();
        schema.setType(Schema.AllSchemaTypes.STRING);
        parameter.setSchema(schema);
        parameter.setImplementation(Parameter.ImplementationLocation.METHOD);
        Protocol http = new Protocol();
        http.setIn(RequestParameterLocation.QUERY);
        Protocols protocols = new Protocols();
        protocols.setHttp(http);
        parameter.setProtocol(protocols);
        Language language = new Language();
        language.setName(name);
        language.setSerializedName(name);
        Languages languages = new Languages();
        languages.setDefault(language);
        languages.setJava(language);
        parameter.setLanguage(languages);
        if (addedVersions != null) {
            XmsExtensions extensions = new XmsExtensions();
            extensions.setXmsVersioningAdded(new ArrayList<>(addedVersions));
            parameter.setExtensions(extensions);
        }
        return parameter;
    }

    private static void useSseSettings(boolean requiredParameterClientMethods) {
        useSseSettings(requiredParameterClientMethods, true, null);
    }

    private static void useSseSettings(boolean requiredParameterClientMethods, boolean dataPlane, String fluent) {
        new MockUnitJavagen() {
            @Override
            public <T> T getValue(String key, IOExceptionCheckedFunction<String, T> converter) {
                try {
                    if ("sync-methods".equals(key)) {
                        return converter.apply("all");
                    }
                    if ("required-parameter-client-methods".equals(key)) {
                        return converter.apply(Boolean.toString(requiredParameterClientMethods));
                    }
                    if ("data-plane".equals(key)) {
                        return converter.apply(Boolean.toString(dataPlane));
                    }
                    if ("fluent".equals(key) && fluent != null) {
                        return converter.apply(fluent);
                    }
                    return super.getValue(key, converter);
                } catch (IOException exception) {
                    throw new UncheckedIOException(exception);
                }
            }
        };
        JavaSettings.clear();
    }

    private static void resetJavaSettings() {
        new MockUnitJavagen();
        JavaSettings.clear();
    }

    private Operation operationWithDescOnResponseSchema(String responseSchemaDesc) {
        return operationWithDescOnOperationAndResponseSchema(null, responseSchemaDesc);
    }

    private Operation operationWithDescOnOperationAndResponseSchema(String operationDesc, String responseSchemaDesc) {
        Operation operation;
        operation = new Operation();
        Languages languages = new Languages();
        Language defaultLang = new Language();
        if (operationDesc != null) {
            defaultLang.setDescription("get " + operationDesc);
        }
        languages.setDefault(defaultLang);
        operation.setLanguage(languages);
        Response response = new Response();
        Schema schema = new Schema();
        schema.setSummary(responseSchemaDesc);
        response.setSchema(schema);
        operation.setResponses(new ArrayList<>(Collections.singletonList(response)));
        Request request = new Request();
        Protocols protocols = new Protocols();
        Protocol http = new Protocol();
        http.setMethod(HttpMethod.HEAD.name());
        protocols.setHttp(http);
        request.setProtocol(protocols);
        operation.setRequests(new ArrayList<>(Collections.singletonList(request)));
        return operation;
    }
}
