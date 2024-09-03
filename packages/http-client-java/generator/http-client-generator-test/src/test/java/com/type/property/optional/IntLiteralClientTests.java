// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.optional;

import com.type.property.optional.models.IntLiteralProperty;
import com.type.property.optional.models.IntLiteralPropertyProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class IntLiteralClientTests {
    private final IntLiteralClient client = new OptionalClientBuilder().buildIntLiteralClient();

    @Test
    public void getAll() {
        IntLiteralProperty intLiteralProperty = client.getAll();
        Assertions.assertEquals(IntLiteralPropertyProperty.ONE, intLiteralProperty.getProperty());
    }

    @Test
    public void getDefault() {
        IntLiteralProperty intLiteralProperty = client.getDefault();
        Assertions.assertNull(intLiteralProperty.getProperty());
    }

    @Test
    public void putAll() {
        IntLiteralProperty intLiteralProperty = new IntLiteralProperty();
        intLiteralProperty.setProperty(IntLiteralPropertyProperty.ONE);
        client.putAll(intLiteralProperty);
    }

    @Test
    public void putDefault() {
        IntLiteralProperty intLiteralProperty = new IntLiteralProperty();
        client.putDefault(intLiteralProperty);
    }
}
