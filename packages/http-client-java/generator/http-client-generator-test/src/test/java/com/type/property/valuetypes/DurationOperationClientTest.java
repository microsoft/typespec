// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.valuetypes;

import com.type.property.valuetypes.models.DurationProperty;
import java.time.Duration;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class DurationOperationClientTest {

    DurationOperationClient client = new ValueTypesClientBuilder().buildDurationOperationClient();

    @Test
    void get() {
        DurationProperty durationProperty = client.get();
        Assertions.assertEquals("PT2974H14M12.011S", durationProperty.getProperty().toString());
    }

    @Test
    void put() {
        Duration duration = Duration.parse("PT2974H14M12.011S");
        DurationProperty property = new DurationProperty(duration);
        client.put(property);
    }
}
