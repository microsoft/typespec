// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ConvertFromJsonTypeTraitTests {

    @Test
    public void testPrimitiveTypeConversion() {
        Assertions.assertEquals("var", PrimitiveType.INT.convertFromJsonType("var"));
        Assertions.assertEquals("var == null ? null : Integer.parseInt(var)",
            PrimitiveType.INT_AS_STRING.convertFromJsonType("var"));
        Assertions.assertEquals("Duration.ofNanos((long) (var * 1000_000_000L))",
            PrimitiveType.DURATION_DOUBLE.convertFromJsonType("var"));
        Assertions.assertEquals("OffsetDateTime.ofInstant(Instant.ofEpochSecond(var), ZoneOffset.UTC)",
            PrimitiveType.UNIX_TIME_LONG.convertFromJsonType("var"));
    }

    @Test
    public void testClassTypeConversion() {
        Assertions.assertEquals("var", ClassType.LONG.convertFromJsonType("var"));
        Assertions.assertEquals("var == null ? null : new DateTimeRfc1123(var)",
            ClassType.DATE_TIME_RFC_1123.convertFromJsonType("var"));
        Assertions.assertEquals("var == null ? null : OffsetDateTime.parse(var)",
            ClassType.DATE_TIME.convertFromJsonType("var"));
        Assertions.assertEquals("var == null ? null : Duration.parse(var)",
            ClassType.DURATION.convertFromJsonType("var"));
        Assertions.assertEquals("Duration.ofSeconds(var)", ClassType.DURATION_LONG.convertFromJsonType("var"));
    }

    @Test
    public void testEnumConversion() {
        ClientEnumValue enumValue = new ClientEnumValue("VALUE_ONE", "1", "ValueOne");

        EnumType.Builder enumTypeBuilder = new EnumType.Builder().name("SampleEnum")
            .elementType(ClassType.STRING)
            .values(List.of(enumValue))
            .expandable(true);

        Assertions.assertEquals("var == null ? null : SampleEnum.fromString(var)",
            enumTypeBuilder.build().convertFromJsonType("var"));

        enumTypeBuilder.expandable(false);
        Assertions.assertEquals("var == null ? null : SampleEnum.fromString(var)",
            enumTypeBuilder.build().convertFromJsonType("var"));

        enumTypeBuilder.elementType(ClassType.INTEGER);
        Assertions.assertEquals("var == null ? null : SampleEnum.fromInteger(var)",
            enumTypeBuilder.build().convertFromJsonType("var"));
    }
}
