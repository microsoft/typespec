// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullSource;

public class TypeUtilTests {
    @ParameterizedTest
    @MethodSource("responseTypes")
    public void recognizesKnownGenericResponseTypes(ClassType responseType) {
        GenericType type = new GenericType(responseType.getPackage(), responseType.getName(), ClassType.STRING);

        assertTrue(TypeUtil.isResponse(type));
    }

    private static Stream<ClassType> responseTypes() {
        return Stream.of(ClassType.RESPONSE, ClassType.RESPONSE_BASE, ClassType.PAGED_RESPONSE,
            ClassType.PAGED_RESPONSE_BASE, ClassType.SIMPLE_RESPONSE, ClassType.STREAM_RESPONSE);
    }

    @ParameterizedTest
    @MethodSource("nonResponseTypes")
    @NullSource
    public void rejectsNonResponsesAndUnrelatedTypesWithTheSameName(IType type) {
        assertFalse(TypeUtil.isResponse(type));
    }

    private static Stream<IType> nonResponseTypes() {
        return Stream.of(ClassType.RESPONSE, ClassType.STRING, PrimitiveType.VOID, new ListType(ClassType.STRING),
            GenericType.mono(GenericType.response(ClassType.STRING)), GenericType.flux(ClassType.STRING),
            new GenericType("com.example", "Response", ClassType.STRING),
            new GenericType(ClassType.RESPONSE.getPackage(), "CustomResponse", ClassType.STRING));
    }
}
