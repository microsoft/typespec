// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.MockUnitJavagen;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConvenienceApi;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocol;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocols;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Response;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
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

@Isolated
public class ClientMethodMapperTests {
    @Test
    public void preservesInternalSseWrapperVisibility() {
        new MockUnitJavagen() {
            @Override
            public <T> T getValue(String key, IOExceptionCheckedFunction<String, T> converter) {
                if ("sync-methods".equals(key)) {
                    try {
                        return converter.apply("all");
                    } catch (IOException exception) {
                        throw new UncheckedIOException(exception);
                    }
                }
                return super.getValue(key, converter);
            }
        };
        JavaSettings.clear();
        try {
            for (boolean internal : List.of(false, true)) {
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
                operation.setInternalApi(internal);
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
                SseEventMetadata event = new SseEventMetadata();
                event.setName("message");
                event.setPayload(payload);
                SseMetadata metadata = new SseMetadata();
                metadata.setStreamName("TestEvents");
                metadata.setModelNamespace("com.azure.mock");
                metadata.setEvents(List.of(event));
                operation.setSseMetadata(metadata);

                var used = new java.util.LinkedHashSet<SseMetadata>();
                var mapper = ClientMethodMapper.getInstance();
                List<ClientMethod> sseMethods = mapper.withSseUsage(used::add, () -> mapper.map(operation, false))
                    .stream()
                    .filter(method -> method.getType() == ClientMethodType.SseSync
                        || method.getType() == ClientMethodType.SseAsync)
                    .collect(Collectors.toList());
                Assertions.assertEquals(java.util.Set.of(ClientMethodType.SseSync, ClientMethodType.SseAsync),
                    sseMethods.stream().map(ClientMethod::getType).collect(Collectors.toSet()));
                sseMethods.forEach(
                    method -> Assertions.assertEquals(internal ? JavaVisibility.PackagePrivate : JavaVisibility.Public,
                        method.getMethodVisibilityInWrapperClient()));
                Assertions.assertEquals(java.util.Set.of(metadata), used);
                used.clear();
                mapper.withSseUsage(used::add, () -> mapper.map(operation, false));
                Assertions.assertEquals(java.util.Set.of(metadata), used,
                    "Cached mappings still record canonical usage.");
                used.clear();
                mapper.withSseUsage(used::add, () -> mapper.map(operation, true));
                Assertions.assertTrue(used.isEmpty(), "Protocol-only mappings must not emit typed helpers.");
                var nextGeneration = new java.util.LinkedHashSet<SseMetadata>();
                mapper.withSseUsage(nextGeneration::add, () -> List.of());
                Assertions.assertTrue(nextGeneration.isEmpty());
            }
        } finally {
            new MockUnitJavagen();
            JavaSettings.clear();
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
