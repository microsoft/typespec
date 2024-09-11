// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.optional;

import com.type.property.optional.models.RequiredAndOptionalProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class RequiredAndOptionalClientTest {
    RequiredAndOptionalClient client = new OptionalClientBuilder().buildRequiredAndOptionalClient();

    @Test
    void getAll() {
        RequiredAndOptionalProperty requiredAndOptionalProperty = client.getAll();
        Assertions.assertEquals("hello", requiredAndOptionalProperty.getOptionalProperty());
        Assertions.assertEquals(42, requiredAndOptionalProperty.getRequiredProperty());
    }

    @Test
    void getRequiredOnly() {
        RequiredAndOptionalProperty requiredAndOptionalProperty = client.getRequiredOnly();
        Assertions.assertEquals(42, requiredAndOptionalProperty.getRequiredProperty());
        Assertions.assertNull(requiredAndOptionalProperty.getOptionalProperty());
    }

    @Test
    void putAll() {
        RequiredAndOptionalProperty requiredAndOptionalProperty = new RequiredAndOptionalProperty(42);
        requiredAndOptionalProperty.setOptionalProperty("hello");
        client.putAll(requiredAndOptionalProperty);
    }

    @Test
    void putRequiredOnly() {
        RequiredAndOptionalProperty requiredAndOptionalProperty = new RequiredAndOptionalProperty(42);
        client.putRequiredOnly(requiredAndOptionalProperty);
    }
}