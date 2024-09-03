// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.array;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;

class DurationValueClientTest {

    DurationValueClient client = new ArrayClientBuilder().buildDurationValueClient();

    @Test
    void get() {
        List<Duration> response = client.get();
        Assertions.assertEquals(1, response.size());
        Assertions.assertEquals(Duration.parse("P123DT22H14M12.011S"), response.get(0));
    }

    @Test
    void put() {
        Duration duration = Duration.parse("P123DT22H14M12.011S");
        client.put(Arrays.asList(duration));
    }
}