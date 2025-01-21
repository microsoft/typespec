// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.nullable;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.time.Duration;
import org.junit.jupiter.api.Test;
import type.property.nullable.models.DurationProperty;

class DurationOperationClientTest {

    DurationOperationClient client = new NullableClientBuilder().buildDurationOperationClient();

    @Test
    void patchNonNullWithResponse() {
        DurationProperty property = new DurationProperty().setRequiredProperty("foo")
            .setNullableProperty(Duration.parse("PT2974H14M12.011S"));
        client.patchNonNull(property);
    }

    @Test
    void patchNullWithResponse() {
        client.patchNull(new DurationProperty().setRequiredProperty("foo").setNullableProperty(null));
    }

    @Test
    void getNonNull() {
        DurationProperty response = client.getNonNull();
        assertNotNull(response.getNullableProperty());
    }

    @Test
    void getNull() {
        DurationProperty response = client.getNull();
        assertNull(response.getNullableProperty());

    }
}
