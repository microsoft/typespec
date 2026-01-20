// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ConvertToJsonTypeTraitTests {

    @Test
    public void testPrimitiveTypeConversion() {
        Assertions.assertEquals("var", PrimitiveType.INT.convertToJsonType("var"));
        Assertions.assertEquals("Objects.toString(var, null)", PrimitiveType.INT_AS_STRING.convertToJsonType("var"));
        Assertions.assertEquals("(double) var.toNanos() / 1000_000_000L",
            PrimitiveType.DURATION_DOUBLE.convertToJsonType("var"));
    }

    @Test
    public void testClassTypeConversion() {
        Assertions.assertEquals("var", ClassType.LONG.convertToJsonType("var"));
        Assertions.assertEquals("Objects.toString(new DateTimeRfc1123(var), null)",
            ClassType.DATE_TIME_RFC_1123.convertToJsonType("var"));
        Assertions.assertEquals("var == null ? null : DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(var)",
            ClassType.DATE_TIME.convertToJsonType("var"));
        Assertions.assertEquals("CoreUtils.durationToStringWithDays(var)", ClassType.DURATION.convertToJsonType("var"));
    }
}
