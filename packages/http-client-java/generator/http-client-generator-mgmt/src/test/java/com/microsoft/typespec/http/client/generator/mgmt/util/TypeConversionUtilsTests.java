// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.util;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MapType;
import com.microsoft.typespec.http.client.generator.mgmt.TestUtils;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

public class TypeConversionUtilsTests {

    @BeforeAll
    public static void ensurePlugin() {
        new TestUtils.MockFluentGen();
    }

    @Test
    public void testConversionExpression() {
        IType innerType = new ClassType.Builder().packageName("com.azure.resourcemanager.mock.fluent.models")
            .name("MockResourceInner")
            .build();

        IType mapType = new MapType(innerType);
        String convertedExpression
            = TypeConversionUtils.conversionExpression(mapType, TypeConversionUtils.tempVariableName());
        Assertions.assertEquals(
            "inner.entrySet().stream().collect(Collectors.toMap(Map.Entry::getKey, inner1 -> new MockResourceImpl(inner1.getValue(), this.manager())))",
            convertedExpression);

        IType listType = new ListType(innerType);
        convertedExpression
            = TypeConversionUtils.conversionExpression(listType, TypeConversionUtils.tempVariableName());
        Assertions.assertEquals(
            "inner.stream().map(inner1 -> new MockResourceImpl(inner1, this.manager())).collect(Collectors.toList())",
            convertedExpression);

        IType pagedIterableType = GenericType.PagedIterable(innerType);
        convertedExpression
            = TypeConversionUtils.conversionExpression(pagedIterableType, TypeConversionUtils.tempVariableName());
        Assertions.assertEquals(
            "ResourceManagerUtils.mapPage(inner, inner1 -> new MockResourceImpl(inner1, this.manager()))",
            convertedExpression);

        IType responseType = GenericType.Response(innerType);
        convertedExpression
            = TypeConversionUtils.conversionExpression(responseType, TypeConversionUtils.tempVariableName());
        Assertions.assertEquals(
            "new SimpleResponse<>(inner.getRequest(), inner.getStatusCode(), inner.getHeaders(), new MockResourceImpl(inner.getValue(), this.manager()))",
            convertedExpression);

        IType nestedMapType = new MapType(mapType);
        convertedExpression
            = TypeConversionUtils.conversionExpression(nestedMapType, TypeConversionUtils.tempVariableName());
        Assertions.assertEquals(
            "inner.entrySet().stream().collect(Collectors.toMap(Map.Entry::getKey, inner1 -> inner1.getValue().entrySet().stream().collect(Collectors.toMap(Map.Entry::getKey, inner2 -> new MockResourceImpl(inner2.getValue(), this.manager())))))",
            convertedExpression);

        IType nestedListType = new ListType(listType);
        convertedExpression
            = TypeConversionUtils.conversionExpression(nestedListType, TypeConversionUtils.tempVariableName());
        Assertions.assertEquals(
            "inner.stream().map(inner1 -> inner1.stream().map(inner2 -> new MockResourceImpl(inner2, this.manager())).collect(Collectors.toList())).collect(Collectors.toList())",
            convertedExpression);
    }

    private void expressionsWorkbench() {
        {
            // map
            Map<String, MockInner> inner = new HashMap();
            Map<String, MockResourceImpl> impl = inner.entrySet()
                .stream()
                .collect(Collectors.toMap(Map.Entry::getKey,
                    inner1 -> new MockResourceImpl(inner1.getValue(), this.manager())));
        }

        {
            // nested map
            Map<String, Map<String, MockInner>> inner = new HashMap();
            Map<String, Map<String, MockResourceImpl>> impl = inner.entrySet()
                .stream()
                .collect(Collectors.toMap(Map.Entry::getKey,
                    inner1 -> inner1.getValue()
                        .entrySet()
                        .stream()
                        .collect(Collectors.toMap(Map.Entry::getKey,
                            inner2 -> new MockResourceImpl(inner2.getValue(), this.manager())))));
        }

        {
            // nested list
            List<List<MockInner>> inner = new ArrayList<>();
            List<List<MockResourceImpl>> impl = inner.stream()
                .map(inner1 -> inner1.stream()
                    .map(inner2 -> new MockResourceImpl(inner2, this.manager()))
                    .collect(Collectors.toList()))
                .collect(Collectors.toList());
        }
    }

    private String manager() {
        return null;
    }

    private static class MockInner {
    }

    private static class MockResourceImpl {
        public MockResourceImpl(MockInner inner, String manager) {
            // do nothing
        }
    }
}
