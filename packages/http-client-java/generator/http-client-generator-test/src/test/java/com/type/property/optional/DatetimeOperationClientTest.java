// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.optional;

import com.type.property.optional.models.DatetimeProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;

class DatetimeOperationClientTest {

    DatetimeOperationClient client = new OptionalClientBuilder().buildDatetimeOperationClient();

    @Test
    void getAll() {
        DatetimeProperty datetimeProperty = client.getAll();
        Assertions.assertEquals("2022-08-26T18:38Z", datetimeProperty.getProperty().toString());
    }

    @Test
    void getDefault() {
        DatetimeProperty datetimeProperty = client.getDefault();
        Assertions.assertNull(datetimeProperty.getProperty());
    }

    @Test
    void putAll() {
        OffsetDateTime offsetDateTime = OffsetDateTime.parse("2022-08-26T18:38Z");
        DatetimeProperty datetimeProperty = new DatetimeProperty();
        datetimeProperty.setProperty(offsetDateTime);
        client.putAll(datetimeProperty);
    }

    @Test
    void putDefault() {
        DatetimeProperty datetimeProperty = new DatetimeProperty();
        client.putDefault(datetimeProperty);
    }
}