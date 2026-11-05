// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mapper;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;

import com.microsoft.typespec.http.client.generator.JavaSettingsTestBase;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.PrimitiveSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema.AllSchemaTypes;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;

public class TypeSpecPrimitiveMapperTests extends JavaSettingsTestBase {
    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    public void mapsDatesToLocalDateForBothClientModes(boolean dataPlane) {
        configureJavaSettings(Map.of("data-plane", Boolean.toString(dataPlane)));

        assertSame(ClassType.LOCAL_DATE, new TypeSpecPrimitiveMapper().map(schema(AllSchemaTypes.DATE)));
    }

    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    public void preservesUnixTimeConversionForBothClientModes(boolean dataPlane) {
        configureJavaSettings(Map.of("data-plane", Boolean.toString(dataPlane)));

        assertSame(PrimitiveType.UNIX_TIME_LONG, new TypeSpecPrimitiveMapper().map(schema(AllSchemaTypes.UNIXTIME)));
    }

    @ParameterizedTest
    @MethodSource("inheritedPrimitiveTypes")
    public void delegatesOtherPrimitiveTypesToTheCoreMapper(AllSchemaTypes schemaType, IType expected) {
        assertSame(expected, new TypeSpecPrimitiveMapper().map(schema(schemaType)));
    }

    private static Stream<Arguments> inheritedPrimitiveTypes() {
        return Stream.of(Arguments.of(AllSchemaTypes.BOOLEAN, PrimitiveType.BOOLEAN),
            Arguments.of(AllSchemaTypes.CHAR, PrimitiveType.CHAR),
            Arguments.of(AllSchemaTypes.STRING, ClassType.STRING),
            Arguments.of(AllSchemaTypes.OBJECT, ClassType.OBJECT), Arguments.of(AllSchemaTypes.UUID, ClassType.UUID));
    }

    @Test
    public void mapsNullToNull() {
        assertNull(new TypeSpecPrimitiveMapper().map(null));
    }

    private static PrimitiveSchema schema(AllSchemaTypes type) {
        PrimitiveSchema schema = new PrimitiveSchema();
        schema.setType(type);
        return schema;
    }
}
