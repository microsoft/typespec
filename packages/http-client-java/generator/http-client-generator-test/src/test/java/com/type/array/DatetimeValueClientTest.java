// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.array;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;

class DatetimeValueClientTest {

    DatetimeValueClient client = new ArrayClientBuilder().buildDatetimeValueClient();

    @Test
    void get() {
        List<OffsetDateTime> response = client.get();
        Assertions.assertEquals(1, response.size());
        Assertions.assertEquals(OffsetDateTime.parse("2022-08-26T18:38:00Z"), response.get(0));
    }

    @Test
    void put() {
        List<OffsetDateTime> body = Arrays.asList(OffsetDateTime.parse("2022-08-26T18:38:00Z"));
        client.put(body);
    }
}