// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.scalar;

import io.clientcore.core.models.binarydata.BinaryData;
import java.io.IOException;
import java.math.BigDecimal;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import type.property.valuetypes.DecimalProperty;

public class DecimalTests {

    @ParameterizedTest
    @ValueSource(classes = { DecimalProperty.class })
    public <T> void testBigDecimal(Class<T> clazz) throws IOException {
        // precision larger than double
        BigDecimal value = new BigDecimal("12345678901234567890.1234567890");
        String json = BinaryData.fromObject(newInstance(clazz, value)).toString();
        T test = BinaryData.fromString(json).toObject(clazz);
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
