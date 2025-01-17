// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.optional;

import java.time.OffsetDateTime;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class DatetimeOperationClientTest {

    private final DatetimeOperationClient client = new OptionalClientBuilder().buildDatetimeOperationClient();

    @Test
    public void getAll() {
        DatetimeProperty datetimeProperty = client.getAll();
        Assertions.assertEquals("2022-08-26T18:38Z", datetimeProperty.getProperty().toString());
    }

    @Test
    public void getDefault() {
        DatetimeProperty datetimeProperty = client.getDefault();
        Assertions.assertNull(datetimeProperty.getProperty());
    }

    @Test
    public void putAll() {
        OffsetDateTime offsetDateTime = OffsetDateTime.parse("2022-08-26T18:38Z");
        DatetimeProperty datetimeProperty = new DatetimeProperty();
        datetimeProperty.setProperty(offsetDateTime);
        client.putAll(datetimeProperty);
    }

    @Test
    public void putDefault() {
        DatetimeProperty datetimeProperty = new DatetimeProperty();
        client.putDefault(datetimeProperty);
    }
}
