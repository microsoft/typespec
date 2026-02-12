// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.util;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MapType;
import com.microsoft.typespec.http.client.generator.mgmt.TestUtils;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

public class TypeConversionUtilsTests {

    @BeforeAll
    public static void ensurePlugin() {
        new TestUtils.MockFluentGen();
    }

    @ParameterizedTest
    @MethodSource("testConversionExpressionSupplier")
    public void testConversionExpression(IType type, String expectedExpression) {
        Assertions.assertEquals(expectedExpression,
            TypeConversionUtils.conversionExpression(type, TypeConversionUtils.tempVariableName()));
    }

    private static Stream<Arguments> testConversionExpressionSupplier() {
        IType innerType = new ClassType.Builder().packageName("com.azure.resourcemanager.mock.fluent.models")
            .name("MockResourceInner")
            .build();

        return Stream.of(
            Arguments.of(new MapType(innerType),
                "inner.entrySet().stream().collect(Collectors"
                    + ".toMap(Map.Entry::getKey, inner1 -> new MockResourceImpl(inner1.getValue(), this.manager())))"),
            Arguments.of(new ListType(innerType),
                "inner.stream()"
                    + ".map(inner1 -> new MockResourceImpl(inner1, this.manager())).collect(Collectors.toList())"),
            Arguments.of(GenericType.pagedIterable(innerType),
                "ResourceManagerUtils.mapPage(inner, inner1 -> new MockResourceImpl(inner1, this.manager()))"),
            Arguments.of(GenericType.response(innerType), "new SimpleResponse<>(inner.getRequest(), "
                + "inner.getStatusCode(), inner.getHeaders(), new MockResourceImpl(inner.getValue(), this.manager()))"),
            Arguments.of(new MapType(new MapType(innerType)), "inner.entrySet().stream().collect(Collectors"
                + ".toMap(Map.Entry::getKey, inner1 -> inner1.getValue().entrySet().stream().collect(Collectors"
                + ".toMap(Map.Entry::getKey, inner2 -> new MockResourceImpl(inner2.getValue(), this.manager())))))"),
            Arguments.of(new ListType(new ListType(innerType)),
                "inner.stream().map(inner1 -> inner1.stream()"
                    + ".map(inner2 -> new MockResourceImpl(inner2, this.manager())).collect(Collectors.toList()))"
                    + ".collect(Collectors.toList())"));
    }
}
