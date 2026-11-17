// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.microsoft.typespec.http.client.generator.JavaSettingsTestBase;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter.ImplementationLocation;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import java.util.Map;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

public class TypeSpecProxyParameterMapperTests extends JavaSettingsTestBase {
    @ParameterizedTest
    @CsvSource({
        "true, CLIENT, true, false",
        "true, METHOD, true, true",
        "true, CLIENT, false, true",
        "true, METHOD, false, true",
        "false, CLIENT, true, false",
        "false, METHOD, true, false",
        "false, CLIENT, false, false",
        "false, METHOD, false, false" })
    public void onlyPreservesClientEnumsWhenRemovingProtocolModels(boolean dataPlane,
        ImplementationLocation implementation, boolean enumType, boolean expected) {
        configureJavaSettings(Map.of("data-plane", Boolean.toString(dataPlane)));
        Parameter parameter = new Parameter();
        parameter.setImplementation(implementation);
        IType type = enumType
            ? new EnumType.Builder().name("ServiceVersion").build()
            : new ClassType.Builder().packageName("com.azure.mock.models").name("Options").build();

        assertEquals(expected, new TypeSpecProxyParameterMapper().isRemoveModelFromClientType(parameter, type));
    }
}
