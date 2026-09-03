// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ArrayType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import java.util.List;
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

    private static ClientMethod methodWithReturnType(IType returnType) {
        return new ClientMethod.Builder().name("test")
            .description("test")
            .parameters(List.of())
            .returnValue(new ReturnValue("test", returnType))
            .build();
    }
}
