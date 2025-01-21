// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.valuetypes;

import java.time.OffsetDateTime;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class DatetimeOperationClientTest {

    private final DatetimeOperationClient client = new ValueTypesClientBuilder().buildDatetimeOperationClient();

    @Test
    public void get() {
        DatetimeProperty datetimeProperty = client.get();
        Assertions.assertEquals("2022-08-26T18:38Z", datetimeProperty.getProperty().toString());
    }

    @Test
    public void put() {
        OffsetDateTime offsetDateTime = OffsetDateTime.parse("2022-08-26T18:38Z");
        DatetimeProperty datetimeProperty = new DatetimeProperty(offsetDateTime);
        client.put(datetimeProperty);
    }
}
