// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

package com.type.property.valuetypes;

import com.type.property.valuetypes.models.BooleanLiteralProperty;
import com.type.property.valuetypes.models.FloatLiteralProperty;
import com.type.property.valuetypes.models.IntLiteralProperty;
import com.type.property.valuetypes.models.StringLiteralProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class LiteralTests {
    private final BooleanLiteralClient booleanLiteralClient = new ValueTypesClientBuilder().buildBooleanLiteralClient();
    private final FloatLiteralClient floatLiteralClient = new ValueTypesClientBuilder().buildFloatLiteralClient();
    private final IntLiteralClient intLiteralClient = new ValueTypesClientBuilder().buildIntLiteralClient();
    private final StringLiteralClient stringLiteralClient = new ValueTypesClientBuilder().buildStringLiteralClient();

    @Test
    public void testBooleanLiteral() {
        BooleanLiteralProperty body = new BooleanLiteralProperty();
        booleanLiteralClient.put(body);

        Assertions.assertNotNull(booleanLiteralClient.get());
        Assertions.assertTrue(booleanLiteralClient.get().isProperty());
    }

    @Test
    public void testFloatLiteral() {
        FloatLiteralProperty body = new FloatLiteralProperty();
        floatLiteralClient.put(body);

        Assertions.assertNotNull(floatLiteralClient.get());
        Assertions.assertEquals(43.125, floatLiteralClient.get().getProperty());
    }

    @Test
    public void testIntLiteralClient() {
        IntLiteralProperty body = new IntLiteralProperty();
        intLiteralClient.put(body);

        Assertions.assertNotNull(intLiteralClient.get());
        Assertions.assertEquals(42, intLiteralClient.get().getProperty());
    }

    @Test
    public void testStringLiteral() {
        StringLiteralProperty body = new StringLiteralProperty();
        stringLiteralClient.put(body);

        Assertions.assertNotNull(stringLiteralClient.get());
        Assertions.assertEquals("hello", stringLiteralClient.get().getProperty());
    }
}
