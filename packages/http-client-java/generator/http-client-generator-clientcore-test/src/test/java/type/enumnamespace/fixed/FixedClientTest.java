// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.enumnamespace.fixed;

import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.pipeline.HttpRetryOptions;
import io.clientcore.core.models.binarydata.BinaryData;
import java.time.Duration;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class FixedClientTest {

    private final FixedClient client
        = new FixedClientBuilder().httpRetryOptions(new HttpRetryOptions(0, Duration.ZERO)).buildFixedClient();

    @Test
    @Disabled("java.lang.ClassCastException: class java.lang.String cannot be cast to class type.enums.fixed.DaysOfWeekEnum")
    public void getKnownValue() {
        DaysOfWeekEnum daysOfWeekEnum = client.getKnownValue();
        Assertions.assertEquals(DaysOfWeekEnum.MONDAY, daysOfWeekEnum);
    }

    @Test
    public void putKnownValue() {
        client.putKnownValue(DaysOfWeekEnum.MONDAY);
    }

    @Test
    public void putUnknownValue() {
        // Not a valid test for Java, as compiler will fail at "DaysOfWeekEnum.WEEKEND"
        // client.putUnknownValue(DaysOfWeekEnum.WEEKEND);

        Assertions.assertThrowsExactly(HttpResponseException.class,
            () -> client.putUnknownValueWithResponse(BinaryData.fromObject("Weekend"), null));
    }
}
