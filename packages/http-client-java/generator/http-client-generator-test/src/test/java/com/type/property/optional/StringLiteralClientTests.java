// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.optional;

import com.type.property.optional.models.StringLiteralProperty;
import com.type.property.optional.models.StringLiteralPropertyProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class StringLiteralClientTests {
    private final StringLiteralClient client = new OptionalClientBuilder().buildStringLiteralClient();

    @Test
    public void getAll() {
        StringLiteralProperty stringLiteralProperty = client.getAll();
        Assertions.assertEquals(StringLiteralPropertyProperty.HELLO, stringLiteralProperty.getProperty());
    }

    @Test
    public void getDefault() {
        StringLiteralProperty stringLiteralProperty = client.getDefault();
        Assertions.assertNull(stringLiteralProperty.getProperty());
    }

    @Test
    public void putAll() {
        StringLiteralProperty stringLiteralProperty = new StringLiteralProperty();
        stringLiteralProperty.setProperty(StringLiteralPropertyProperty.HELLO);
        client.putAll(stringLiteralProperty);
    }

    @Test
    public void putDefault() {
        StringLiteralProperty stringLiteralProperty = new StringLiteralProperty();
        client.putDefault(stringLiteralProperty);
    }
}
