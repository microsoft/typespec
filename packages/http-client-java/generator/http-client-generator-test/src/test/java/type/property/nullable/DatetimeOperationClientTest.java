// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.nullable;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.time.OffsetDateTime;
import org.junit.jupiter.api.Test;
import type.property.nullable.models.DatetimeProperty;

class DatetimeOperationClientTest {

    DatetimeOperationClient client = new NullableClientBuilder().buildDatetimeOperationClient();

    @Test
    void patchNonNullWithResponse() {
        OffsetDateTime offsetDateTime = OffsetDateTime.parse("2022-08-26T18:38:00Z");
        DatetimeProperty datetimeProperty
            = new DatetimeProperty().setRequiredProperty("foo").setNullableProperty(offsetDateTime);
        client.patchNonNull(datetimeProperty);
    }

    @Test
    void patchNullWithResponse() {
        client.patchNull(new DatetimeProperty().setRequiredProperty("foo").setNullableProperty(null));
    }

    @Test
    void getNonNull() {
        DatetimeProperty response = client.getNonNull();
        assertNotNull(response.getNullableProperty());
    }

    @Test
    void getNull() {
        DatetimeProperty response = client.getNull();
        assertNull(response.getNullableProperty());
    }
}
