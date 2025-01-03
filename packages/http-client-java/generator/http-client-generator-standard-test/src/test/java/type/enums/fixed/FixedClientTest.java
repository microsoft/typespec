// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.enums.fixed;

import java.time.Duration;

import io.clientcore.core.http.exception.HttpResponseException;
import io.clientcore.core.http.models.HttpRetryOptions;
import io.clientcore.core.util.binarydata.BinaryData;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

class FixedClientTest {

    FixedClient client
        = new FixedClientBuilder().httpRetryOptions(new HttpRetryOptions(0, Duration.ZERO))
            .buildFixedClient();

    @Test
    @Disabled("type.enums.fixed.DaysOfWeekEnum is in unnamed module of loader 'app'")
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
