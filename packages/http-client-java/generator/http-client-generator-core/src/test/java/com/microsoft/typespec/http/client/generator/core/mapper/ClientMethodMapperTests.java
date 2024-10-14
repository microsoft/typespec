// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.azure.core.http.HttpMethod;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocol;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocols;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Response;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Versioning;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ClientMethodMapperTests {

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
        returnType = GenericType.Mono(baseType);
        description = ClientMethodMapperAccessor.getDescription(operation, returnType, baseType);
        Assertions.assertEquals(expectedDescription, description);        // Mono<Boolean>
        baseType = PrimitiveType.BOOLEAN;
        returnType = GenericType.Mono(baseType);
        description = ClientMethodMapperAccessor.getDescription(operation, returnType, baseType);
        Assertions.assertEquals(expectedDescription, description);
        // Response
        operation = operationWithDescOnOperationAndResponseSchema(operationDesc, responseSchemaDesc);
        expectedDescription = String.format("%s along with {@link Response}", operationDesc);
        // Response<Void>
        baseType = PrimitiveType.VOID;
        returnType = GenericType.Response(baseType);
        description = ClientMethodMapperAccessor.getDescription(operation, returnType, baseType);
        Assertions.assertEquals(expectedDescription, description);        // Response<Boolean>
        baseType = PrimitiveType.BOOLEAN;
        returnType = GenericType.Response(baseType);
        description = ClientMethodMapperAccessor.getDescription(operation, returnType, baseType);
        Assertions.assertEquals(expectedDescription, description);

        // description on schema
        // Mono
        operation = operationWithDescOnResponseSchema(responseSchemaDesc);
        expectedDescription = String.format("%s on successful completion of {@link Mono}", responseSchemaDesc);
        // Mono<Void>
        baseType = PrimitiveType.VOID;
        returnType = GenericType.Mono(baseType);
        description = ClientMethodMapperAccessor.getDescription(operation, returnType, baseType);
        // Mono<Boolean>
        Assertions.assertEquals(expectedDescription, description);
        baseType = PrimitiveType.BOOLEAN;
        returnType = GenericType.Mono(baseType);
        description = ClientMethodMapperAccessor.getDescription(operation, returnType, baseType);
        // Mono<T>
        Assertions.assertEquals(expectedDescription, description);
        baseType = GenericType.Response(ClassType.STRING);
        returnType = GenericType.Mono(baseType);
        description = ClientMethodMapperAccessor.getDescription(operation, returnType, baseType);
        expectedDescription
            = "desc from response schema along with {@link Response} on successful completion of {@link Mono}";
        Assertions.assertEquals(expectedDescription, description);

        // Response
        operation = operationWithDescOnResponseSchema(responseSchemaDesc);
        expectedDescription = String.format("%s along with {@link Response}", responseSchemaDesc);
        // Response<Void>
        baseType = PrimitiveType.VOID;
        returnType = GenericType.Response(baseType);
        description = ClientMethodMapperAccessor.getDescription(operation, returnType, baseType);
        Assertions.assertEquals(expectedDescription, description);
        // Response<Boolean>
        baseType = PrimitiveType.BOOLEAN;
        returnType = GenericType.Response(baseType);
        description = ClientMethodMapperAccessor.getDescription(operation, returnType, baseType);
        Assertions.assertEquals(expectedDescription, description);
        // Response<T>
        baseType = GenericType.Mono(ClassType.STRING);
        returnType = GenericType.Response(baseType);
        description = ClientMethodMapperAccessor.getDescription(operation, returnType, baseType);
        Assertions.assertEquals(expectedDescription, description);

        // no description on either operation or schema
        // Mono
        operation = operationWithNoDesc();
        // Mono<Void>
        baseType = PrimitiveType.VOID;
        returnType = GenericType.Mono(baseType);
        description = ClientMethodMapperAccessor.getDescription(operation, returnType, baseType);
        expectedDescription = "A {@link Mono} that completes when a successful response is received";
        Assertions.assertEquals(expectedDescription, description);
        // Mono<Boolean>
        baseType = PrimitiveType.BOOLEAN;
        returnType = GenericType.Mono(baseType);
        description = ClientMethodMapperAccessor.getDescription(operation, returnType, baseType);
        expectedDescription = String.format("%s on successful completion of {@link Mono}", "whether resource exists");
        Assertions.assertEquals(expectedDescription, description);
        // Mono<Response>
        baseType = GenericType.Response(ClassType.STRING);
        returnType = GenericType.Mono(baseType);
        description = ClientMethodMapperAccessor.getDescription(operation, returnType, baseType);
        expectedDescription = "the response body along with {@link Response} on successful completion of {@link Mono}";
        Assertions.assertEquals(expectedDescription, description);

        // Response
        operation = operationWithNoDesc();
        // Response<Void>
        baseType = PrimitiveType.VOID;
        returnType = GenericType.Response(baseType);
        description = ClientMethodMapperAccessor.getDescription(operation, returnType, baseType);
        expectedDescription = "the {@link Response}";
        Assertions.assertEquals(expectedDescription, description);
        // Response<Boolean>
        baseType = PrimitiveType.BOOLEAN;
        returnType = GenericType.Response(baseType);
        description = ClientMethodMapperAccessor.getDescription(operation, returnType, baseType);
        expectedDescription = String.format("%s along with {@link Response}", "whether resource exists");
        Assertions.assertEquals(expectedDescription, description);
        // Response<T>
        baseType = ClassType.STRING;
        returnType = GenericType.Response(baseType);
        description = ClientMethodMapperAccessor.getDescription(operation, returnType, baseType);
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
