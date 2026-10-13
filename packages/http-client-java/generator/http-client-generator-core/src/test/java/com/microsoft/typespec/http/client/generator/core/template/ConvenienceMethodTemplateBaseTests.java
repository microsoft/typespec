// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ArrayType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFileContents;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ConvenienceMethodTemplateBaseTests {

    @Test
    public void unwrapsMonoResponse() {
        IType leaf = ClassType.STRING;
        IType returnType = GenericType.mono(GenericType.response(leaf));

        IType result = ConvenienceMethodTemplateBase.getConvenienceResponseBodyType(methodWithReturnType(returnType));

        Assertions.assertSame(leaf, result);
    }

    @Test
    public void unwrapsPagedFlux() {
        IType leaf = ClassType.BINARY_DATA;
        IType returnType = GenericType.pagedFlux(leaf);

        IType result = ConvenienceMethodTemplateBase.getConvenienceResponseBodyType(methodWithReturnType(returnType));

        Assertions.assertSame(leaf, result);
    }

    @Test
    public void unwrapsResponseBaseSecondTypeArgument() {
        IType leaf = ClassType.INTEGER;
        IType returnType = GenericType.restResponse(ClassType.BINARY_DATA, leaf);

        IType result = ConvenienceMethodTemplateBase.getConvenienceResponseBodyType(methodWithReturnType(returnType));

        Assertions.assertSame(leaf, result);
    }

    @Test
    public void unwrapsNestedMonoPagedResponseBase() {
        IType leaf = ArrayType.BYTE_ARRAY;
        IType pagedResponseBase = new GenericType(ClassType.PAGED_RESPONSE_BASE.getPackage(),
            ClassType.PAGED_RESPONSE_BASE.getName(), ClassType.STRING, leaf);
        IType returnType = GenericType.mono(pagedResponseBase);

        IType result = ConvenienceMethodTemplateBase.getConvenienceResponseBodyType(methodWithReturnType(returnType));

        Assertions.assertSame(leaf, result);
    }

    @Test
    public void keepsNonGenericTypeUnchanged() {
        IType returnType = ClassType.BASE_64_URL;

        IType result = ConvenienceMethodTemplateBase.getConvenienceResponseBodyType(methodWithReturnType(returnType));

        Assertions.assertSame(returnType, result);
    }

    @Test
    public void binaryDataResponsesIgnoreContentType() {
        for (String contentType : List.of("text/plain", "application/json", "application/xml",
            "application/octet-stream")) {
            Assertions.assertEquals("return readWithResponse(requestOptions).getValue();",
                renderConversion(false, ClassType.BINARY_DATA, ClassType.STRING, contentType));
            Assertions.assertEquals("return readWithResponse(requestOptions).flatMap(FluxUtil::toMono);",
                renderConversion(true, ClassType.BINARY_DATA, ClassType.STRING, contentType));
        }
    }

    @Test
    public void textBytesResponsesUseRawBytes() {
        Assertions.assertEquals("return readWithResponse(requestOptions).getValue().toBytes();",
            renderConversion(false, ArrayType.BYTE_ARRAY, ArrayType.BYTE_ARRAY, "text/plain"));
        Assertions.assertEquals(
            "return readWithResponse(requestOptions).flatMap(FluxUtil::toMono).map(protocolMethodData -> protocolMethodData.toBytes());",
            renderConversion(true, ArrayType.BYTE_ARRAY, ArrayType.BYTE_ARRAY, "text/plain"));
    }

    @Test
    public void textStringsKeepTextConversion() {
        Assertions.assertEquals("return readWithResponse(requestOptions).getValue().toString();",
            renderConversion(false, ClassType.STRING, ClassType.STRING, "text/plain"));
        Assertions.assertEquals(
            "return readWithResponse(requestOptions).flatMap(FluxUtil::toMono).map(protocolMethodData -> protocolMethodData.toString());",
            renderConversion(true, ClassType.STRING, ClassType.STRING, "text/plain"));
    }

    @Test
    public void jsonBytesKeepDeserialization() {
        Assertions.assertEquals("return readWithResponse(requestOptions).getValue().toObject(byte[].class);",
            renderConversion(false, ArrayType.BYTE_ARRAY, ArrayType.BYTE_ARRAY, "application/json"));
        Assertions.assertEquals(
            "return readWithResponse(requestOptions).flatMap(FluxUtil::toMono).map(protocolMethodData -> protocolMethodData.toObject(byte[].class));",
            renderConversion(true, ArrayType.BYTE_ARRAY, ArrayType.BYTE_ARRAY, "application/json"));
    }

    private static String renderConversion(boolean async, IType responseBodyType, IType rawType, String contentType) {
        ProxyMethod proxyMethod = new ProxyMethod.Builder().name("read")
            .responseBodyType(ClassType.BINARY_DATA)
            .rawResponseBodyType(rawType)
            .responseContentTypes(Set.of(contentType))
            .build();
        IType protocolReturnType = GenericType.response(ClassType.BINARY_DATA);
        ClientMethod protocolMethod = new ClientMethod.Builder().name("readWithResponse")
            .parameters(List.of())
            .proxyMethod(proxyMethod)
            .type(async ? ClientMethodType.SimpleAsyncRestResponse : ClientMethodType.SimpleSyncRestResponse)
            .returnValue(new ReturnValue("response", async ? GenericType.mono(protocolReturnType) : protocolReturnType))
            .build();
        ClientMethod convenienceMethod = new ClientMethod.Builder().name("read")
            .parameters(List.of())
            .proxyMethod(proxyMethod)
            .type(async ? ClientMethodType.SimpleAsync : ClientMethodType.SimpleSync)
            .returnValue(new ReturnValue("response", async ? GenericType.mono(responseBodyType) : responseBodyType))
            .build();
        JavaFileContents contents = new JavaFileContents();
        ConvenienceMethodTemplateBase template
            = async ? ConvenienceAsyncMethodTemplate.getInstance() : ConvenienceSyncMethodTemplate.getInstance();
        template.writeInvocationAndConversion(convenienceMethod, protocolMethod, "requestOptions",
            new JavaBlock(contents), new HashSet<>());
        return contents.toString().trim();
    }

    private static ClientMethod methodWithReturnType(IType returnType) {
        return new ClientMethod.Builder().name("test")
            .description("test")
            .parameters(List.of())
            .returnValue(new ReturnValue("test", returnType))
            .build();
    }
}
