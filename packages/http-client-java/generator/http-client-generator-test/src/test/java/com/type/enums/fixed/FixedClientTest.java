// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.enums.fixed;

import com.azure.core.exception.HttpResponseException;
import com.azure.core.http.policy.FixedDelayOptions;
import com.azure.core.http.policy.RetryOptions;
import com.azure.core.util.BinaryData;
import com.type.enums.fixed.models.DaysOfWeekEnum;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.time.Duration;

class FixedClientTest {

    FixedClient client = new FixedClientBuilder()
        .retryOptions(new RetryOptions(new FixedDelayOptions(0, Duration.ZERO)))
        .buildClient();

    @Test
    void getKnownValue() {
        DaysOfWeekEnum daysOfWeekEnum = client.getKnownValue();
        Assertions.assertEquals(DaysOfWeekEnum.MONDAY, daysOfWeekEnum);
    }

    @Test
    void putKnownValue() {
        client.putKnownValue(DaysOfWeekEnum.MONDAY);
    }


    @Test
    void putUnknownValue() {
        // Not a valid test for Java, as compiler will fail at "DaysOfWeekEnum.WEEKEND"
        // client.putUnknownValue(DaysOfWeekEnum.WEEKEND);

        Assertions.assertThrowsExactly(HttpResponseException.class,
            () -> client.putUnknownValueWithResponse(BinaryData.fromObject("Weekend"), null));
    }
}