// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.optional;

import com.type.property.optional.models.PlainDateProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

public class PlainDateClientTests {
    private final PlainDateClient client = new OptionalClientBuilder().buildPlainDateClient();

    @Test
    public void getAll() {
        PlainDateProperty PlainDateProperty = client.getAll();
        Assertions.assertEquals(LocalDate.parse("2022-12-12"), PlainDateProperty.getProperty());
    }

    @Test
    public void getDefault() {
        PlainDateProperty PlainDateProperty = client.getDefault();
        Assertions.assertNull(PlainDateProperty.getProperty());
    }

    @Test
    public void putAll() {
        client.putAll(new PlainDateProperty().setProperty(LocalDate.parse("2022-12-12")));
    }

    @Test
    public void putDefault() {
        client.putDefault(new PlainDateProperty());
    }
}
