// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.scalar;

import com.azure.core.annotation.Immutable;
import com.azure.core.util.BinaryData;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.type.property.valuetypes.models.DecimalProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;

public class DecimalTests {

    @Immutable
    public static class DecimalJackson {
        @JsonProperty("property")
        private BigDecimal property;

        public DecimalJackson(@JsonProperty("property") BigDecimal property) {
            this.property = property;
        }

        public BigDecimal getProperty() {
            return property;
        }
    }

    @ParameterizedTest
    @ValueSource(classes = {DecimalProperty.class, DecimalJackson.class})
    public <T> void testBigDecimal(Class<T> clazz) {
        // precision larger than double
        BigDecimal value = new BigDecimal("12345678901234567890.1234567890");
        String json = BinaryData.fromObject(newInstance(clazz, value)).toString();
        var test = BinaryData.fromString(json).toObject(clazz);
        Assertions.assertEquals(value, getProperty(clazz, test));

        // make sure precision difference would cause NotEquals
        Assertions.assertNotEquals(value, new BigDecimal("12345678901234567890.123456789"));

        // scientific
        value = new BigDecimal("1.2345678901234567890E23");
        json = BinaryData.fromObject(newInstance(clazz, value)).toString();
        test = BinaryData.fromString(json).toObject(clazz);
        Assertions.assertEquals(value, getProperty(clazz, test));

        value = new BigDecimal("-1.2345678901234567890e-105");
        json = BinaryData.fromObject(newInstance(clazz, value)).toString();
        test = BinaryData.fromString(json).toObject(clazz);
        Assertions.assertEquals(value, getProperty(clazz, test));
    }

    private static <T> T newInstance(Class<T> clazz, BigDecimal value) {
        try {
            return clazz.getDeclaredConstructor(BigDecimal.class).newInstance(value);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static <T> BigDecimal getProperty(Class<T> clazz, T obj) {
        try {
            return (BigDecimal) clazz.getDeclaredMethod("getProperty").invoke(obj);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
