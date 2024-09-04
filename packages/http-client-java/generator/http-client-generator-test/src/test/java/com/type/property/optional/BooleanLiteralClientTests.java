// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.optional;

import com.type.property.optional.models.BooleanLiteralProperty;
import com.type.property.optional.models.BooleanLiteralPropertyProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class BooleanLiteralClientTests {
    private final BooleanLiteralClient client = new OptionalClientBuilder().buildBooleanLiteralClient();

    @Test
    public void getAll() {
        BooleanLiteralProperty booleanLiteralProperty = client.getAll();
        Assertions.assertEquals(BooleanLiteralPropertyProperty.TRUE, booleanLiteralProperty.getProperty());
    }

    @Test
    public void getDefault() {
        BooleanLiteralProperty booleanLiteralProperty = client.getDefault();
        Assertions.assertNull(booleanLiteralProperty.getProperty());
    }

    @Test
    public void putAll() {
        BooleanLiteralProperty booleanLiteralProperty = new BooleanLiteralProperty();
        booleanLiteralProperty.setProperty(BooleanLiteralPropertyProperty.TRUE);
        client.putAll(booleanLiteralProperty);
    }

    @Test
    public void putDefault() {
        BooleanLiteralProperty booleanLiteralProperty = new BooleanLiteralProperty();
        client.putDefault(booleanLiteralProperty);
    }
}
